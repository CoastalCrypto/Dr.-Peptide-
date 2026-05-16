import os
from fastapi import HTTPException
import httpx
import logging
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)

OPENFDA_BASE_URL = "https://api.fda.gov/drug/label.json"
OPENFDA_API_KEY = os.environ.get("OPENFDA_API_KEY", "")  # Optional, for higher rate limits

async def search_medications(
    query: str,
    limit: int = 20,
    skip: int = 0
) -> Dict[str, Any]:
    """
    Search FDA drug labels by generic name, brand name, or drug class.
    
    Args:
        query: Search term (medication name or keyword)
        limit: Number of results (max 100)
        skip: Pagination offset
    
    Returns:
        Dict with results array and metadata
    """
    if not query.strip():
        return {"results": [], "meta": {"total": 0}}
    
    # Build search query - search across multiple fields
    # Use URL-safe format for OR operator (space instead of +OR+)
    search_query = (
        f'openfda.generic_name:"{query}" '
        f'openfda.brand_name:"{query}" '
        f'openfda.substance_name:"{query}" '
        f'openfda.pharm_class_epc:"{query}"'
    )
    
    # Build URL manually to avoid double-encoding issues with httpx
    url = f"{OPENFDA_BASE_URL}?search={search_query}&limit={min(limit, 100)}&skip={skip}"
    if OPENFDA_API_KEY:
        url += f"&api_key={OPENFDA_API_KEY}"
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url)
            
            if response.status_code == 404:
                # No results found
                return {"results": [], "meta": {"total": 0}}
            
            if response.status_code == 429:
                raise HTTPException(status_code=429, detail="FDA API rate limit exceeded. Try again later.")
            
            response.raise_for_status()
            data = response.json()
            
            return {
                "results": parse_fda_results(data.get("results", [])),
                "meta": data.get("meta", {"results": {"total": 0}})
            }
    except httpx.TimeoutException:
        logger.error("OpenFDA API timeout")
        raise HTTPException(status_code=504, detail="FDA API request timed out")
    except httpx.HTTPStatusError as e:
        logger.error(f"OpenFDA API error: {e}")
        raise HTTPException(status_code=502, detail=f"FDA API error: {str(e)}")
    except Exception as e:
        logger.error(f"OpenFDA API unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch FDA data")


async def get_medication_details(set_id: str) -> Optional[Dict[str, Any]]:
    """
    Get detailed medication information by set_id.
    
    Args:
        set_id: FDA label set ID
    
    Returns:
        Detailed medication info or None
    """
    params = {
        "search": f'set_id:"{set_id}"',
        "limit": 1
    }
    
    if OPENFDA_API_KEY:
        params["api_key"] = OPENFDA_API_KEY
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(OPENFDA_BASE_URL, params=params)
            
            if response.status_code == 404:
                return None
            
            response.raise_for_status()
            data = response.json()
            
            results = data.get("results", [])
            if results:
                return parse_fda_detail(results[0])
            return None
    except Exception as e:
        logger.error(f"OpenFDA get detail error: {e}")
        return None


def parse_fda_results(results: List[Dict]) -> List[Dict[str, Any]]:
    """Parse FDA API results into a simplified format."""
    parsed = []
    
    for item in results:
        openfda = item.get("openfda", {})
        
        # Get brand names
        brand_names = openfda.get("brand_name", [])
        if isinstance(brand_names, str):
            brand_names = [brand_names]
        
        # Get generic name
        generic_names = openfda.get("generic_name", [])
        generic_name = generic_names[0] if generic_names else ""
        
        # Get drug class
        drug_classes = openfda.get("pharm_class_epc", [])
        drug_class = drug_classes[0] if drug_classes else ""
        
        # Get substance names
        substances = openfda.get("substance_name", [])
        
        # Get indications (uses)
        indications = item.get("indications_and_usage", [])
        if isinstance(indications, str):
            indications = [indications]
        uses = []
        for ind in indications[:2]:  # Limit to first 2
            # Truncate long text
            if len(ind) > 300:
                ind = ind[:300] + "..."
            uses.append(ind)
        
        # Get side effects
        adverse = item.get("adverse_reactions", [])
        if isinstance(adverse, str):
            adverse = [adverse]
        side_effects = []
        if adverse:
            # Extract first few sentences
            text = adverse[0][:500] if adverse[0] else ""
            side_effects = [text] if text else []
        
        # Get contraindications
        contras = item.get("contraindications", [])
        if isinstance(contras, str):
            contras = [contras]
        contraindications = []
        if contras:
            text = contras[0][:300] if contras[0] else ""
            contraindications = [text] if text else []
        
        # Get warnings
        warnings = item.get("warnings", item.get("warnings_and_cautions", []))
        if isinstance(warnings, str):
            warnings = [warnings]
        
        # Get dosage info
        dosage_info = item.get("dosage_and_administration", [])
        if isinstance(dosage_info, str):
            dosage_info = [dosage_info]
        dosage = dosage_info[0][:300] + "..." if dosage_info and len(dosage_info[0]) > 300 else (dosage_info[0] if dosage_info else "")
        
        parsed.append({
            "id": item.get("set_id", item.get("id", "")),
            "set_id": item.get("set_id", ""),
            "genericName": generic_name,
            "brandNames": brand_names[:5],  # Limit brand names
            "drugClass": drug_class,
            "substances": substances[:3],
            "uses": uses,
            "dosage": dosage,
            "sideEffects": side_effects,
            "contraindications": contraindications,
            "hasBoxedWarning": bool(item.get("boxed_warning")),
            "source": "openfda"
        })
    
    return parsed


def parse_fda_detail(item: Dict) -> Dict[str, Any]:
    """Parse a single FDA result into detailed format."""
    openfda = item.get("openfda", {})
    
    return {
        "id": item.get("set_id", ""),
        "set_id": item.get("set_id", ""),
        "genericName": (openfda.get("generic_name", [""])[0] if openfda.get("generic_name") else ""),
        "brandNames": openfda.get("brand_name", [])[:10],
        "drugClass": (openfda.get("pharm_class_epc", [""])[0] if openfda.get("pharm_class_epc") else ""),
        "manufacturer": (openfda.get("manufacturer_name", [""])[0] if openfda.get("manufacturer_name") else ""),
        "substances": openfda.get("substance_name", []),
        "routes": openfda.get("route", []),
        "dosageForms": openfda.get("dosage_form", []),
        "indications": item.get("indications_and_usage", []),
        "dosageAndAdministration": item.get("dosage_and_administration", []),
        "contraindications": item.get("contraindications", []),
        "warnings": item.get("warnings", []),
        "warningsAndCautions": item.get("warnings_and_cautions", []),
        "boxedWarning": item.get("boxed_warning", []),
        "adverseReactions": item.get("adverse_reactions", []),
        "drugInteractions": item.get("drug_interactions", []),
        "pregnancyInfo": item.get("pregnancy", []),
        "pediatricUse": item.get("pediatric_use", []),
        "geriatricUse": item.get("geriatric_use", []),
        "overdosage": item.get("overdosage", []),
        "storage": item.get("storage_and_handling", []),
        "source": "openfda"
    }
