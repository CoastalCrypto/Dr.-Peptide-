export interface Medication {
  id: string;
  genericName: string;
  brandNames: string[];
  drugClass: string;
  uses: string[];
  standardDosage: string;
  sideEffects: string[];
  contraindications: string[];
  interactions: string[];
  timing: string;
}

export const medications: Medication[] = [
  {
    id: 'metformin', genericName: 'Metformin', brandNames: ['Glucophage', 'Fortamet'],
    drugClass: 'Biguanide (Antidiabetic)',
    uses: ['Type 2 diabetes', 'Insulin resistance', 'PCOS', 'Anti-aging research'],
    standardDosage: '500-2000 mg/day in divided doses. Start 500 mg with dinner, increase gradually.',
    sideEffects: ['GI upset', 'Nausea', 'Diarrhea', 'Metallic taste', 'B12 deficiency (long-term)'],
    contraindications: ['Severe kidney disease (eGFR <30)', 'Metabolic acidosis', 'Heavy alcohol use'],
    interactions: ['IV contrast dye (hold 48h)', 'Alcohol', 'Other diabetes medications', 'Topiramate'],
    timing: 'Take with meals to reduce GI side effects. Extended-release: take with evening meal.',
  },
  {
    id: 'levothyroxine', genericName: 'Levothyroxine', brandNames: ['Synthroid', 'Levoxyl'],
    drugClass: 'Thyroid Hormone',
    uses: ['Hypothyroidism', 'Thyroid hormone replacement', 'TSH suppression'],
    standardDosage: '25-200 mcg/day. Start low (25-50 mcg), adjust every 6-8 weeks based on TSH.',
    sideEffects: ['Heart palpitations (if dose too high)', 'Weight changes', 'Insomnia', 'Hair loss (temporary)'],
    contraindications: ['Untreated adrenal insufficiency', 'Recent heart attack', 'Thyrotoxicosis'],
    interactions: ['Calcium/iron supplements (separate by 4h)', 'Antacids', 'Coffee (wait 60 min)', 'Biotin (affects lab results)'],
    timing: 'Take on empty stomach, 30-60 min before breakfast. Consistent timing is critical.',
  },
  {
    id: 'atorvastatin', genericName: 'Atorvastatin', brandNames: ['Lipitor'],
    drugClass: 'HMG-CoA Reductase Inhibitor (Statin)',
    uses: ['High cholesterol', 'Cardiovascular disease prevention', 'Post-heart attack'],
    standardDosage: '10-80 mg/day. Typical: 10-20 mg for primary prevention, 40-80 mg for high risk.',
    sideEffects: ['Muscle pain/weakness', 'Liver enzyme elevation', 'Digestive issues', 'Headache'],
    contraindications: ['Active liver disease', 'Pregnancy', 'Breastfeeding'],
    interactions: ['Grapefruit juice', 'Gemfibrozil', 'Clarithromycin', 'Cyclosporine', 'Niacin (high dose)'],
    timing: 'Can be taken any time of day. Take consistently at the same time.',
  },
  {
    id: 'lisinopril', genericName: 'Lisinopril', brandNames: ['Zestril', 'Prinivil'],
    drugClass: 'ACE Inhibitor',
    uses: ['High blood pressure', 'Heart failure', 'Kidney protection in diabetes'],
    standardDosage: '5-40 mg/day. Start 5-10 mg, max 40 mg. Once daily dosing.',
    sideEffects: ['Dry cough', 'Dizziness', 'Elevated potassium', 'Headache'],
    contraindications: ['Pregnancy', 'History of angioedema', 'Bilateral renal artery stenosis'],
    interactions: ['Potassium supplements', 'NSAIDs', 'Lithium', 'Aliskiren'],
    timing: 'Take once daily. Can be taken with or without food. Morning preferred.',
  },
  {
    id: 'omeprazole', genericName: 'Omeprazole', brandNames: ['Prilosec', 'Nexium (similar)'],
    drugClass: 'Proton Pump Inhibitor (PPI)',
    uses: ['GERD/acid reflux', 'Stomach ulcers', 'H. pylori treatment', 'NSAID gastroprotection'],
    standardDosage: '20-40 mg/day. 20 mg for maintenance, 40 mg for active ulcers/severe GERD.',
    sideEffects: ['Headache', 'Diarrhea', 'B12 deficiency (long-term)', 'Magnesium depletion', 'Bone fracture risk'],
    contraindications: ['Known hypersensitivity', 'Concurrent rilpivirine'],
    interactions: ['Clopidogrel (avoid combination)', 'Methotrexate', 'Iron/calcium absorption'],
    timing: 'Take 30-60 min before first meal of the day. Swallow whole, do not crush.',
  },
  {
    id: 'sertraline', genericName: 'Sertraline', brandNames: ['Zoloft'],
    drugClass: 'SSRI (Antidepressant)',
    uses: ['Depression', 'Anxiety disorders', 'OCD', 'PTSD', 'Panic disorder'],
    standardDosage: '50-200 mg/day. Start 25-50 mg, increase by 25-50 mg every 1-2 weeks.',
    sideEffects: ['Nausea', 'Insomnia', 'Sexual dysfunction', 'Diarrhea', 'Dry mouth', 'Drowsiness'],
    contraindications: ['MAO inhibitor use (within 14 days)', 'Concurrent pimozide', 'Concurrent disulfiram (liquid form)'],
    interactions: ['MAO inhibitors', 'Other serotonergic drugs', 'Warfarin', 'NSAIDs (bleeding risk)'],
    timing: 'Take once daily, morning or evening. Take with food to reduce nausea. Do NOT stop abruptly.',
  },
  {
    id: 'metoprolol', genericName: 'Metoprolol', brandNames: ['Lopressor', 'Toprol-XL'],
    drugClass: 'Beta-Blocker',
    uses: ['High blood pressure', 'Heart failure', 'Angina', 'Post-heart attack', 'Heart rate control'],
    standardDosage: 'IR: 25-100 mg 2x/day. ER: 25-200 mg once daily.',
    sideEffects: ['Fatigue', 'Dizziness', 'Cold extremities', 'Bradycardia', 'Depression'],
    contraindications: ['Severe bradycardia', 'Heart block (2nd/3rd degree)', 'Cardiogenic shock', 'Decompensated heart failure'],
    interactions: ['Calcium channel blockers', 'Clonidine', 'Digoxin', 'CYP2D6 inhibitors'],
    timing: 'IR: Take with meals. ER: Take with or without food. Do NOT stop abruptly - taper gradually.',
  },
  {
    id: 'vitamin-d3', genericName: 'Vitamin D3', brandNames: ['Cholecalciferol'],
    drugClass: 'Vitamin/Supplement',
    uses: ['Vitamin D deficiency', 'Bone health', 'Immune support', 'Mood support'],
    standardDosage: '1000-5000 IU/day maintenance. 50,000 IU/week for deficiency (with monitoring).',
    sideEffects: ['Hypercalcemia (high doses)', 'Nausea', 'Constipation', 'Kidney stones (rare)'],
    contraindications: ['Hypercalcemia', 'Sarcoidosis', 'Severe kidney disease'],
    interactions: ['Thiazide diuretics', 'Steroids', 'Orlistat', 'Cholestyramine'],
    timing: 'Take with a fat-containing meal for better absorption. Any time of day.',
  },
  {
    id: 'magnesium-glycinate', genericName: 'Magnesium Glycinate', brandNames: ['Mag Glycinate', 'BioOptimal'],
    drugClass: 'Mineral Supplement',
    uses: ['Magnesium deficiency', 'Muscle cramps', 'Sleep support', 'Anxiety', 'Migraine prevention'],
    standardDosage: '200-400 mg elemental magnesium/day. Split doses if GI upset occurs.',
    sideEffects: ['Diarrhea (less than other forms)', 'Drowsiness', 'Low blood pressure (high doses)'],
    contraindications: ['Severe kidney disease', 'Myasthenia gravis', 'Heart block'],
    interactions: ['Antibiotics (tetracyclines, quinolones)', 'Bisphosphonates', 'Levodopa'],
    timing: 'Take with food. Evening dosing may help sleep. Separate from antibiotics by 2+ hours.',
  },
  {
    id: 'ashwagandha', genericName: 'Ashwagandha', brandNames: ['KSM-66', 'Sensoril', 'Withania somnifera'],
    drugClass: 'Adaptogen/Herbal Supplement',
    uses: ['Stress reduction', 'Cortisol management', 'Sleep', 'Testosterone support', 'Thyroid support'],
    standardDosage: '300-600 mg/day standardized root extract (KSM-66). Full spectrum: 500-1000 mg.',
    sideEffects: ['GI upset', 'Drowsiness', 'Thyroid hormone changes'],
    contraindications: ['Hyperthyroidism', 'Autoimmune conditions (may stimulate)', 'Pregnancy', 'Surgery (2 weeks before)'],
    interactions: ['Thyroid medications', 'Immunosuppressants', 'Sedatives', 'Diabetes medications'],
    timing: 'Take with meals. For sleep: take in the evening. For stress: morning or split doses.',
  },
  {
    id: 'creatine', genericName: 'Creatine Monohydrate', brandNames: ['Creapure', 'Various'],
    drugClass: 'Sports Supplement',
    uses: ['Muscle strength/power', 'Exercise performance', 'Cognitive function', 'Recovery'],
    standardDosage: '3-5 g/day maintenance. Optional loading: 20 g/day split doses for 5-7 days.',
    sideEffects: ['Water retention', 'GI discomfort (high doses)', 'Weight gain (water)'],
    contraindications: ['Severe kidney disease'],
    interactions: ['NSAIDs (theoretical kidney concern)', 'Caffeine (may reduce acute effects)'],
    timing: 'Take any time daily. Post-workout with carbs/protein may be slightly optimal.',
  },
  {
    id: 'omega-3', genericName: 'Omega-3 Fish Oil', brandNames: ['Lovaza', 'Vascepa', 'Various'],
    drugClass: 'Essential Fatty Acid Supplement',
    uses: ['Heart health', 'Triglyceride reduction', 'Anti-inflammation', 'Joint health', 'Brain health'],
    standardDosage: '1000-4000 mg combined EPA+DHA/day. Prescription triglyceride reduction: 4000 mg/day.',
    sideEffects: ['Fishy burps', 'GI upset', 'Loose stools', 'Mild bleeding risk'],
    contraindications: ['Fish/shellfish allergy (some sources)', 'Active bleeding disorders'],
    interactions: ['Blood thinners (warfarin, aspirin)', 'Blood pressure medications'],
    timing: 'Take with a fat-containing meal to reduce fishy burps and improve absorption.',
  },
];
