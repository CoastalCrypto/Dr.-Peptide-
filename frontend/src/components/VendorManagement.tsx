import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { typography, spacing } from '../theme';
import { vendorsApi, ordersApi, Vendor, Order } from '../utils/api';
import { Storage } from '../utils/storage';

const PAYMENT_METHODS = ['Crypto', 'Credit Card', 'Debit Card', 'Wire Transfer', 'PayPal', 'Zelle', 'Cash App', 'Other'];
const ORDER_STATUSES = ['pending', 'shipped', 'delivered', 'cancelled'] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: '#FFD60A',
  shipped: '#00A8E8',
  delivered: '#30D158',
  cancelled: '#FF453A',
};

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function VendorManagement({ visible, onClose }: Props) {
  const { colors } = useTheme();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'vendors' | 'orders'>('vendors');
  
  // Vendor form state
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [vendorForm, setVendorForm] = useState({
    name: '',
    website: '',
    email: '',
    phone: '',
    payment_methods: [] as string[],
    notes: '',
    rating: 0,
    is_domestic: true,
    avg_shipping_days: '',
  });
  
  // Order form state
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [orderForm, setOrderForm] = useState<{
    vendor_id: string;
    order_number: string;
    order_date: string;
    items: string;
    total_amount: string;
    currency: string;
    status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
    tracking_number: string;
    tracking_url: string;
    expected_delivery: string;
    notes: string;
  }>({
    vendor_id: '',
    order_number: '',
    order_date: new Date().toISOString().split('T')[0],
    items: '',
    total_amount: '',
    currency: 'USD',
    status: 'pending',
    tracking_number: '',
    tracking_url: '',
    expected_delivery: '',
    notes: '',
  });
  
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showVendorDetail, setShowVendorDetail] = useState(false);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vendorData, orderData] = await Promise.all([
        vendorsApi.getAll().catch(() => []),
        ordersApi.getAll().catch(() => []),
      ]);
      setVendors(vendorData);
      setOrders(orderData);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetVendorForm = () => {
    setVendorForm({
      name: '',
      website: '',
      email: '',
      phone: '',
      payment_methods: [],
      notes: '',
      rating: 0,
      is_domestic: true,
      avg_shipping_days: '',
    });
    setEditingVendor(null);
  };

  const resetOrderForm = () => {
    setOrderForm({
      vendor_id: '',
      order_number: '',
      order_date: new Date().toISOString().split('T')[0],
      items: '',
      total_amount: '',
      currency: 'USD',
      status: 'pending',
      tracking_number: '',
      tracking_url: '',
      expected_delivery: '',
      notes: '',
    });
    setEditingOrder(null);
  };

  const openVendorForm = (vendor?: Vendor) => {
    if (vendor) {
      setEditingVendor(vendor);
      setVendorForm({
        name: vendor.name,
        website: vendor.website || '',
        email: vendor.email || '',
        phone: vendor.phone || '',
        payment_methods: vendor.payment_methods || [],
        notes: vendor.notes || '',
        rating: vendor.rating || 0,
        is_domestic: vendor.is_domestic,
        avg_shipping_days: vendor.avg_shipping_days?.toString() || '',
      });
    } else {
      resetVendorForm();
    }
    setShowVendorModal(true);
  };

  const openOrderForm = (order?: Order, vendorId?: string) => {
    if (order) {
      setEditingOrder(order);
      setOrderForm({
        vendor_id: order.vendor_id,
        order_number: order.order_number || '',
        order_date: order.order_date,
        items: order.items?.join(', ') || '',
        total_amount: order.total_amount?.toString() || '',
        currency: order.currency || 'USD',
        status: order.status,
        tracking_number: order.tracking_number || '',
        tracking_url: order.tracking_url || '',
        expected_delivery: order.expected_delivery || '',
        notes: order.notes || '',
      });
    } else {
      resetOrderForm();
      if (vendorId) {
        setOrderForm(prev => ({ ...prev, vendor_id: vendorId }));
      }
    }
    setShowOrderModal(true);
  };

  const saveVendor = async () => {
    if (!vendorForm.name.trim()) {
      Alert.alert('Error', 'Vendor name is required');
      return;
    }

    try {
      const data = {
        name: vendorForm.name.trim(),
        website: vendorForm.website.trim() || undefined,
        email: vendorForm.email.trim() || undefined,
        phone: vendorForm.phone.trim() || undefined,
        payment_methods: vendorForm.payment_methods,
        notes: vendorForm.notes.trim() || undefined,
        rating: vendorForm.rating || undefined,
        is_domestic: vendorForm.is_domestic,
        ships_to: [],
        avg_shipping_days: vendorForm.avg_shipping_days ? parseInt(vendorForm.avg_shipping_days) : undefined,
      };

      if (editingVendor) {
        await vendorsApi.update(editingVendor.vendor_id, data);
      } else {
        await vendorsApi.create(data as any);
      }

      setShowVendorModal(false);
      resetVendorForm();
      loadData();
    } catch (err) {
      Alert.alert('Error', 'Failed to save vendor');
    }
  };

  const saveOrder = async () => {
    if (!orderForm.vendor_id) {
      Alert.alert('Error', 'Please select a vendor');
      return;
    }

    try {
      const data = {
        vendor_id: orderForm.vendor_id,
        order_number: orderForm.order_number.trim() || undefined,
        order_date: orderForm.order_date,
        items: orderForm.items.split(',').map(i => i.trim()).filter(i => i),
        total_amount: orderForm.total_amount ? parseFloat(orderForm.total_amount) : undefined,
        currency: orderForm.currency,
        status: orderForm.status,
        tracking_number: orderForm.tracking_number.trim() || undefined,
        tracking_url: orderForm.tracking_url.trim() || undefined,
        expected_delivery: orderForm.expected_delivery || undefined,
        notes: orderForm.notes.trim() || undefined,
      };

      if (editingOrder) {
        await ordersApi.update(editingOrder.order_id, data);
      } else {
        await ordersApi.create(data as any);
      }

      setShowOrderModal(false);
      resetOrderForm();
      loadData();
    } catch (err) {
      Alert.alert('Error', 'Failed to save order');
    }
  };

  const deleteVendor = (vendor: Vendor) => {
    Alert.alert('Delete Vendor', `Are you sure you want to delete "${vendor.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await vendorsApi.delete(vendor.vendor_id);
            loadData();
          } catch (err) {
            Alert.alert('Error', 'Failed to delete vendor');
          }
        },
      },
    ]);
  };

  const deleteOrder = (order: Order) => {
    Alert.alert('Delete Order', 'Are you sure you want to delete this order?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await ordersApi.delete(order.order_id);
            loadData();
          } catch (err) {
            Alert.alert('Error', 'Failed to delete order');
          }
        },
      },
    ]);
  };

  const togglePaymentMethod = (method: string) => {
    setVendorForm(prev => ({
      ...prev,
      payment_methods: prev.payment_methods.includes(method)
        ? prev.payment_methods.filter(m => m !== method)
        : [...prev.payment_methods, method],
    }));
  };

  const openVendorDetail = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setShowVendorDetail(true);
  };

  const getVendorOrders = (vendorId: string) => orders.filter(o => o.vendor_id === vendorId);

  const styles = createStyles(colors);

  const renderStars = (rating: number, onPress?: (rating: number) => void) => (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map(i => (
        <TouchableOpacity
          key={i}
          onPress={() => onPress?.(i)}
          disabled={!onPress}
        >
          <MaterialCommunityIcons
            name={i <= rating ? 'star' : 'star-outline'}
            size={24}
            color={i <= rating ? colors.warning : colors.textTertiary}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity testID="vendor-close-btn" onPress={onClose} style={styles.closeBtn}>
            <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Vendor Management</Text>
          <TouchableOpacity
            testID="vendor-add-btn"
            style={styles.addBtn}
            onPress={() => activeTab === 'vendors' ? openVendorForm() : openOrderForm()}
          >
            <MaterialCommunityIcons name="plus" size={24} color={colors.primaryForeground} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            testID="tab-vendors"
            style={[styles.tab, activeTab === 'vendors' && styles.tabActive]}
            onPress={() => setActiveTab('vendors')}
          >
            <MaterialCommunityIcons name="store" size={20} color={activeTab === 'vendors' ? colors.accent : colors.textTertiary} />
            <Text style={[styles.tabText, activeTab === 'vendors' && styles.tabTextActive]}>Vendors</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="tab-orders"
            style={[styles.tab, activeTab === 'orders' && styles.tabActive]}
            onPress={() => setActiveTab('orders')}
          >
            <MaterialCommunityIcons name="package-variant" size={20} color={activeTab === 'orders' ? colors.accent : colors.textTertiary} />
            <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>Orders</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
            {activeTab === 'vendors' ? (
              vendors.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="store-plus" size={64} color={colors.textTertiary} />
                  <Text style={styles.emptyTitle}>No Vendors Yet</Text>
                  <Text style={styles.emptyText}>Add your first vendor to track suppliers</Text>
                </View>
              ) : (
                vendors.map(vendor => (
                  <TouchableOpacity
                    key={vendor.vendor_id}
                    testID={`vendor-card-${vendor.vendor_id}`}
                    style={styles.vendorCard}
                    onPress={() => openVendorDetail(vendor)}
                    onLongPress={() => deleteVendor(vendor)}
                  >
                    <View style={styles.vendorHeader}>
                      <View style={styles.vendorIcon}>
                        <MaterialCommunityIcons name="store" size={24} color={colors.accent} />
                      </View>
                      <View style={styles.vendorInfo}>
                        <Text style={styles.vendorName}>{vendor.name}</Text>
                        {vendor.rating ? renderStars(vendor.rating) : null}
                      </View>
                      <TouchableOpacity
                        testID={`vendor-edit-${vendor.vendor_id}`}
                        onPress={() => openVendorForm(vendor)}
                      >
                        <MaterialCommunityIcons name="pencil" size={20} color={colors.textTertiary} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.vendorMeta}>
                      {vendor.is_domestic !== undefined && (
                        <View style={[styles.badge, { backgroundColor: vendor.is_domestic ? colors.success + '30' : colors.warning + '30' }]}>
                          <Text style={[styles.badgeText, { color: vendor.is_domestic ? colors.success : colors.warning }]}>
                            {vendor.is_domestic ? 'Domestic' : 'International'}
                          </Text>
                        </View>
                      )}
                      {vendor.avg_shipping_days && (
                        <View style={styles.metaItem}>
                          <MaterialCommunityIcons name="truck-delivery" size={14} color={colors.textTertiary} />
                          <Text style={styles.metaText}>~{vendor.avg_shipping_days} days</Text>
                        </View>
                      )}
                    </View>
                    {vendor.payment_methods?.length > 0 && (
                      <View style={styles.paymentMethods}>
                        {vendor.payment_methods.slice(0, 3).map(method => (
                          <View key={method} style={styles.paymentBadge}>
                            <Text style={styles.paymentBadgeText}>{method}</Text>
                          </View>
                        ))}
                        {vendor.payment_methods.length > 3 && (
                          <Text style={styles.moreText}>+{vendor.payment_methods.length - 3}</Text>
                        )}
                      </View>
                    )}
                    <View style={styles.orderCount}>
                      <MaterialCommunityIcons name="package-variant" size={16} color={colors.textTertiary} />
                      <Text style={styles.orderCountText}>{getVendorOrders(vendor.vendor_id).length} orders</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )
            ) : (
              orders.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="package-variant-plus" size={64} color={colors.textTertiary} />
                  <Text style={styles.emptyTitle}>No Orders Yet</Text>
                  <Text style={styles.emptyText}>Track your orders from vendors</Text>
                </View>
              ) : (
                orders.map(order => (
                  <TouchableOpacity
                    key={order.order_id}
                    testID={`order-card-${order.order_id}`}
                    style={styles.orderCard}
                    onPress={() => openOrderForm(order)}
                    onLongPress={() => deleteOrder(order)}
                  >
                    <View style={styles.orderHeader}>
                      <View style={[styles.statusIndicator, { backgroundColor: STATUS_COLORS[order.status] }]} />
                      <View style={styles.orderInfo}>
                        <Text style={styles.orderVendor}>{order.vendor_name}</Text>
                        {order.order_number && (
                          <Text style={styles.orderNumber}>#{order.order_number}</Text>
                        )}
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[order.status] + '30' }]}>
                        <Text style={[styles.statusText, { color: STATUS_COLORS[order.status] }]}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.orderDetails}>
                      <View style={styles.orderDetailRow}>
                        <MaterialCommunityIcons name="calendar" size={14} color={colors.textTertiary} />
                        <Text style={styles.orderDetailText}>
                          {new Date(order.order_date).toLocaleDateString()}
                        </Text>
                      </View>
                      {order.total_amount && (
                        <View style={styles.orderDetailRow}>
                          <MaterialCommunityIcons name="currency-usd" size={14} color={colors.textTertiary} />
                          <Text style={styles.orderDetailText}>
                            {order.total_amount.toFixed(2)} {order.currency}
                          </Text>
                        </View>
                      )}
                      {order.tracking_number && (
                        <View style={styles.orderDetailRow}>
                          <MaterialCommunityIcons name="truck-fast" size={14} color={colors.textTertiary} />
                          <Text style={styles.orderDetailText}>{order.tracking_number}</Text>
                        </View>
                      )}
                    </View>
                    {order.items?.length > 0 && (
                      <View style={styles.orderItems}>
                        <Text style={styles.orderItemsText} numberOfLines={2}>
                          {order.items.join(', ')}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))
              )
            )}
          </ScrollView>
        )}

        {/* Vendor Form Modal */}
        <Modal visible={showVendorModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.formModal}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>{editingVendor ? 'Edit Vendor' : 'Add Vendor'}</Text>
                <TouchableOpacity onPress={() => { setShowVendorModal(false); resetVendorForm(); }}>
                  <MaterialCommunityIcons name="close" size={24} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.formContent}>
                <Text style={styles.inputLabel}>Vendor Name *</Text>
                <TextInput
                  testID="vendor-name-input"
                  style={styles.input}
                  value={vendorForm.name}
                  onChangeText={v => setVendorForm(prev => ({ ...prev, name: v }))}
                  placeholder="Enter vendor name"
                  placeholderTextColor={colors.textTertiary}
                />

                <Text style={styles.inputLabel}>Website</Text>
                <TextInput
                  testID="vendor-website-input"
                  style={styles.input}
                  value={vendorForm.website}
                  onChangeText={v => setVendorForm(prev => ({ ...prev, website: v }))}
                  placeholder="https://example.com"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="url"
                  autoCapitalize="none"
                />

                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  testID="vendor-email-input"
                  style={styles.input}
                  value={vendorForm.email}
                  onChangeText={v => setVendorForm(prev => ({ ...prev, email: v }))}
                  placeholder="contact@example.com"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Text style={styles.inputLabel}>Phone</Text>
                <TextInput
                  testID="vendor-phone-input"
                  style={styles.input}
                  value={vendorForm.phone}
                  onChangeText={v => setVendorForm(prev => ({ ...prev, phone: v }))}
                  placeholder="+1 (555) 123-4567"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="phone-pad"
                />

                <Text style={styles.inputLabel}>Rating</Text>
                {renderStars(vendorForm.rating, (r) => setVendorForm(prev => ({ ...prev, rating: r })))}

                <Text style={styles.inputLabel}>Location</Text>
                <View style={styles.locationToggle}>
                  <TouchableOpacity
                    testID="vendor-domestic-btn"
                    style={[styles.locationBtn, vendorForm.is_domestic && styles.locationBtnActive]}
                    onPress={() => setVendorForm(prev => ({ ...prev, is_domestic: true }))}
                  >
                    <Text style={[styles.locationBtnText, vendorForm.is_domestic && styles.locationBtnTextActive]}>Domestic</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    testID="vendor-intl-btn"
                    style={[styles.locationBtn, !vendorForm.is_domestic && styles.locationBtnActive]}
                    onPress={() => setVendorForm(prev => ({ ...prev, is_domestic: false }))}
                  >
                    <Text style={[styles.locationBtnText, !vendorForm.is_domestic && styles.locationBtnTextActive]}>International</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>Avg Shipping Days</Text>
                <TextInput
                  testID="vendor-shipping-input"
                  style={styles.input}
                  value={vendorForm.avg_shipping_days}
                  onChangeText={v => setVendorForm(prev => ({ ...prev, avg_shipping_days: v }))}
                  placeholder="5"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />

                <Text style={styles.inputLabel}>Payment Methods</Text>
                <View style={styles.paymentGrid}>
                  {PAYMENT_METHODS.map(method => (
                    <TouchableOpacity
                      key={method}
                      testID={`payment-${method}`}
                      style={[styles.paymentOption, vendorForm.payment_methods.includes(method) && styles.paymentOptionActive]}
                      onPress={() => togglePaymentMethod(method)}
                    >
                      <Text style={[styles.paymentOptionText, vendorForm.payment_methods.includes(method) && styles.paymentOptionTextActive]}>
                        {method}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput
                  testID="vendor-notes-input"
                  style={[styles.input, styles.textArea]}
                  value={vendorForm.notes}
                  onChangeText={v => setVendorForm(prev => ({ ...prev, notes: v }))}
                  placeholder="Any additional notes..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={3}
                />
              </ScrollView>

              <TouchableOpacity testID="save-vendor-btn" style={styles.saveBtn} onPress={saveVendor}>
                <Text style={styles.saveBtnText}>{editingVendor ? 'Update Vendor' : 'Add Vendor'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Order Form Modal */}
        <Modal visible={showOrderModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.formModal}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>{editingOrder ? 'Edit Order' : 'Add Order'}</Text>
                <TouchableOpacity onPress={() => { setShowOrderModal(false); resetOrderForm(); }}>
                  <MaterialCommunityIcons name="close" size={24} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.formContent}>
                <Text style={styles.inputLabel}>Vendor *</Text>
                <View style={styles.vendorPicker}>
                  {vendors.map(v => (
                    <TouchableOpacity
                      key={v.vendor_id}
                      testID={`select-vendor-${v.vendor_id}`}
                      style={[styles.vendorPickerItem, orderForm.vendor_id === v.vendor_id && styles.vendorPickerItemActive]}
                      onPress={() => setOrderForm(prev => ({ ...prev, vendor_id: v.vendor_id }))}
                    >
                      <Text style={[styles.vendorPickerText, orderForm.vendor_id === v.vendor_id && styles.vendorPickerTextActive]}>
                        {v.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Order Number</Text>
                <TextInput
                  testID="order-number-input"
                  style={styles.input}
                  value={orderForm.order_number}
                  onChangeText={v => setOrderForm(prev => ({ ...prev, order_number: v }))}
                  placeholder="ORD-12345"
                  placeholderTextColor={colors.textTertiary}
                />

                <Text style={styles.inputLabel}>Order Date</Text>
                <TextInput
                  testID="order-date-input"
                  style={styles.input}
                  value={orderForm.order_date}
                  onChangeText={v => setOrderForm(prev => ({ ...prev, order_date: v }))}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textTertiary}
                />

                <Text style={styles.inputLabel}>Status</Text>
                <View style={styles.statusPicker}>
                  {ORDER_STATUSES.map(status => (
                    <TouchableOpacity
                      key={status}
                      testID={`status-${status}`}
                      style={[styles.statusOption, orderForm.status === status && { backgroundColor: STATUS_COLORS[status] + '30' }]}
                      onPress={() => setOrderForm(prev => ({ ...prev, status }))}
                    >
                      <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[status] }]} />
                      <Text style={[styles.statusOptionText, orderForm.status === status && { color: STATUS_COLORS[status] }]}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Items (comma separated)</Text>
                <TextInput
                  testID="order-items-input"
                  style={[styles.input, styles.textArea]}
                  value={orderForm.items}
                  onChangeText={v => setOrderForm(prev => ({ ...prev, items: v }))}
                  placeholder="BPC-157, TB-500, Ipamorelin"
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={2}
                />

                <View style={styles.priceRow}>
                  <View style={{ flex: 2 }}>
                    <Text style={styles.inputLabel}>Total Amount</Text>
                    <TextInput
                      testID="order-amount-input"
                      style={styles.input}
                      value={orderForm.total_amount}
                      onChangeText={v => setOrderForm(prev => ({ ...prev, total_amount: v }))}
                      placeholder="99.99"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={styles.inputLabel}>Currency</Text>
                    <TextInput
                      testID="order-currency-input"
                      style={styles.input}
                      value={orderForm.currency}
                      onChangeText={v => setOrderForm(prev => ({ ...prev, currency: v }))}
                      placeholder="USD"
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>
                </View>

                <Text style={styles.inputLabel}>Tracking Number</Text>
                <TextInput
                  testID="order-tracking-input"
                  style={styles.input}
                  value={orderForm.tracking_number}
                  onChangeText={v => setOrderForm(prev => ({ ...prev, tracking_number: v }))}
                  placeholder="1Z999AA10123456784"
                  placeholderTextColor={colors.textTertiary}
                />

                <Text style={styles.inputLabel}>Tracking URL</Text>
                <TextInput
                  testID="order-tracking-url-input"
                  style={styles.input}
                  value={orderForm.tracking_url}
                  onChangeText={v => setOrderForm(prev => ({ ...prev, tracking_url: v }))}
                  placeholder="https://track.example.com/..."
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="url"
                  autoCapitalize="none"
                />

                <Text style={styles.inputLabel}>Expected Delivery</Text>
                <TextInput
                  testID="order-expected-input"
                  style={styles.input}
                  value={orderForm.expected_delivery}
                  onChangeText={v => setOrderForm(prev => ({ ...prev, expected_delivery: v }))}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textTertiary}
                />

                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput
                  testID="order-notes-input"
                  style={[styles.input, styles.textArea]}
                  value={orderForm.notes}
                  onChangeText={v => setOrderForm(prev => ({ ...prev, notes: v }))}
                  placeholder="Any additional notes..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={3}
                />
              </ScrollView>

              <TouchableOpacity testID="save-order-btn" style={styles.saveBtn} onPress={saveOrder}>
                <Text style={styles.saveBtnText}>{editingOrder ? 'Update Order' : 'Add Order'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Vendor Detail Modal */}
        <Modal visible={showVendorDetail} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.detailModal}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>{selectedVendor?.name}</Text>
                <TouchableOpacity onPress={() => setShowVendorDetail(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>

              {selectedVendor && (
                <ScrollView style={styles.formContent}>
                  {selectedVendor.rating ? (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Rating</Text>
                      {renderStars(selectedVendor.rating)}
                    </View>
                  ) : null}

                  {selectedVendor.website && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Website</Text>
                      <Text style={styles.detailValue}>{selectedVendor.website}</Text>
                    </View>
                  )}

                  {selectedVendor.email && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Email</Text>
                      <Text style={styles.detailValue}>{selectedVendor.email}</Text>
                    </View>
                  )}

                  {selectedVendor.phone && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Phone</Text>
                      <Text style={styles.detailValue}>{selectedVendor.phone}</Text>
                    </View>
                  )}

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Location</Text>
                    <Text style={styles.detailValue}>{selectedVendor.is_domestic ? 'Domestic' : 'International'}</Text>
                  </View>

                  {selectedVendor.avg_shipping_days && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Avg Shipping Time</Text>
                      <Text style={styles.detailValue}>{selectedVendor.avg_shipping_days} days</Text>
                    </View>
                  )}

                  {selectedVendor.payment_methods?.length > 0 && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Payment Methods</Text>
                      <View style={styles.paymentMethods}>
                        {selectedVendor.payment_methods.map(method => (
                          <View key={method} style={styles.paymentBadge}>
                            <Text style={styles.paymentBadgeText}>{method}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {selectedVendor.notes && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Notes</Text>
                      <Text style={styles.detailValue}>{selectedVendor.notes}</Text>
                    </View>
                  )}

                  <View style={styles.detailSection}>
                    <View style={styles.orderHeaderRow}>
                      <Text style={styles.detailLabel}>Orders ({getVendorOrders(selectedVendor.vendor_id).length})</Text>
                      <TouchableOpacity
                        testID="add-order-from-detail"
                        style={styles.addOrderBtn}
                        onPress={() => {
                          setShowVendorDetail(false);
                          openOrderForm(undefined, selectedVendor.vendor_id);
                        }}
                      >
                        <MaterialCommunityIcons name="plus" size={16} color={colors.primaryForeground} />
                        <Text style={styles.addOrderBtnText}>Add</Text>
                      </TouchableOpacity>
                    </View>
                    {getVendorOrders(selectedVendor.vendor_id).map(order => (
                      <TouchableOpacity
                        key={order.order_id}
                        style={styles.miniOrderCard}
                        onPress={() => {
                          setShowVendorDetail(false);
                          openOrderForm(order);
                        }}
                      >
                        <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[order.status] }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.miniOrderDate}>{new Date(order.order_date).toLocaleDateString()}</Text>
                          {order.items?.length > 0 && (
                            <Text style={styles.miniOrderItems} numberOfLines={1}>{order.items.join(', ')}</Text>
                          )}
                        </View>
                        {order.total_amount && (
                          <Text style={styles.miniOrderAmount}>${order.total_amount.toFixed(2)}</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: 50, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  closeBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  title: { ...typography.h2, color: colors.textPrimary },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: spacing.md },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.accent },
  tabText: { ...typography.bodyBase, color: colors.textTertiary },
  tabTextActive: { color: colors.accent, fontWeight: '600' },
  content: { flex: 1 },
  contentInner: { padding: spacing.md, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  loadingText: { ...typography.bodyBase, color: colors.textSecondary },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: spacing.xxl * 2 },
  emptyTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.md },
  emptyText: { ...typography.bodyBase, color: colors.textTertiary, marginTop: spacing.xs },
  
  // Vendor Card
  vendorCard: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  vendorHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  vendorIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.accent + '20', justifyContent: 'center', alignItems: 'center' },
  vendorInfo: { flex: 1 },
  vendorName: { ...typography.bodyLg, color: colors.textPrimary, fontWeight: '600' },
  vendorMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { ...typography.caption, fontSize: 11 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { ...typography.bodySm, color: colors.textTertiary },
  paymentMethods: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  paymentBadge: { backgroundColor: colors.secondary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  paymentBadgeText: { ...typography.caption, color: colors.textSecondary, fontSize: 10 },
  moreText: { ...typography.bodySm, color: colors.textTertiary },
  orderCount: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  orderCountText: { ...typography.bodySm, color: colors.textTertiary },
  starsRow: { flexDirection: 'row', gap: 2, marginTop: 2 },

  // Order Card
  orderCard: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  orderHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statusIndicator: { width: 4, height: 40, borderRadius: 2 },
  orderInfo: { flex: 1 },
  orderVendor: { ...typography.bodyLg, color: colors.textPrimary, fontWeight: '600' },
  orderNumber: { ...typography.bodySm, color: colors.textTertiary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { ...typography.caption, fontSize: 11 },
  orderDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm },
  orderDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  orderDetailText: { ...typography.bodySm, color: colors.textTertiary },
  orderItems: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  orderItemsText: { ...typography.bodySm, color: colors.textSecondary },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  formModal: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  detailModal: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  formTitle: { ...typography.h3, color: colors.textPrimary },
  formContent: { padding: spacing.md },
  inputLabel: { ...typography.caption, color: colors.textTertiary, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: { height: 48, backgroundColor: colors.secondary, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, color: colors.textPrimary, fontSize: 16 },
  textArea: { height: 80, paddingTop: spacing.sm, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: colors.primary, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', margin: spacing.md, marginBottom: 40 },
  saveBtnText: { ...typography.bodyBase, color: colors.primaryForeground, fontWeight: '700' },

  // Location toggle
  locationToggle: { flexDirection: 'row', gap: spacing.sm },
  locationBtn: { flex: 1, height: 44, backgroundColor: colors.secondary, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  locationBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  locationBtnText: { ...typography.bodyBase, color: colors.textSecondary },
  locationBtnTextActive: { color: colors.primaryForeground, fontWeight: '600' },

  // Payment grid
  paymentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  paymentOption: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.secondary, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  paymentOptionActive: { backgroundColor: colors.accent + '30', borderColor: colors.accent },
  paymentOptionText: { ...typography.bodySm, color: colors.textSecondary },
  paymentOptionTextActive: { color: colors.accent, fontWeight: '600' },

  // Vendor picker (for orders)
  vendorPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  vendorPickerItem: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.secondary, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  vendorPickerItemActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  vendorPickerText: { ...typography.bodyBase, color: colors.textSecondary },
  vendorPickerTextActive: { color: colors.primaryForeground, fontWeight: '600' },

  // Status picker
  statusPicker: { flexDirection: 'row', gap: spacing.xs },
  statusOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, backgroundColor: colors.secondary, borderRadius: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusOptionText: { ...typography.bodySm, color: colors.textSecondary },

  // Price row
  priceRow: { flexDirection: 'row' },

  // Detail modal
  detailSection: { marginBottom: spacing.md },
  detailLabel: { ...typography.caption, color: colors.textTertiary, marginBottom: spacing.xs },
  detailValue: { ...typography.bodyBase, color: colors.textPrimary },
  orderHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  addOrderBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  addOrderBtnText: { ...typography.bodySm, color: colors.primaryForeground, fontWeight: '600' },
  miniOrderCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.secondary, borderRadius: 10, padding: spacing.sm, marginBottom: spacing.xs },
  miniOrderDate: { ...typography.bodySm, color: colors.textPrimary },
  miniOrderItems: { ...typography.caption, color: colors.textTertiary, fontSize: 11 },
  miniOrderAmount: { ...typography.bodyBase, color: colors.accent, fontWeight: '600' },
});
