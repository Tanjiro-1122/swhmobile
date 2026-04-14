import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { getProducts, purchaseProduct, restorePurchases } from './RevenueCatService';

/**
 * PurchaseModal — displays available credit packs and handles purchases.
 *
 * Props:
 *   visible      {boolean}  - whether the modal is shown
 *   onClose      {function} - called when modal should close
 *   initialProductId {string|null} - pre-selected product ID (optional)
 *   onPurchaseComplete {function} - called with { success, productId, customerInfo }
 */
export default function PurchaseModal({
  visible,
  onClose,
  initialProductId = null,
  onPurchaseComplete,
}) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState(null);

  const CREDIT_LABELS = {
    'com.sportswagerhelper.credits.25': { credits: 25, label: '25 Search Credits' },
    'com.sportswagerhelper.credits.60': { credits: 60, label: '60 Search Credits' },
    'com.sportswagerhelper.credits.100': { credits: 100, label: '100 Search Credits' },
  };

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getProducts();
      setPackages(result);
    } catch (err) {
      setError('Failed to load products. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadProducts();
    }
  }, [visible, loadProducts]);

  const handlePurchase = async (pkg) => {
    const productId =
      pkg.product?.productIdentifier ?? pkg.product?.identifier ?? pkg.identifier;

    if (!productId) {
      Alert.alert('Error', 'Unable to identify product. Please try again.');
      return;
    }

    setPurchasing(true);
    try {
      const result = await purchaseProduct(productId);
      if (result.success) {
        Alert.alert('Success! 🎉', 'Your credits have been added to your account.');
        onPurchaseComplete?.({ success: true, productId, customerInfo: result.customerInfo });
        onClose();
      } else if (result.cancelled) {
        // User cancelled — do nothing
      }
    } catch (err) {
      Alert.alert('Purchase Failed', err.message || 'Something went wrong. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setPurchasing(true);
    try {
      const result = await restorePurchases();
      Alert.alert('Restored', 'Your previous purchases have been restored.');
      onPurchaseComplete?.({ success: true, restored: true, customerInfo: result.customerInfo });
      onClose();
    } catch (err) {
      Alert.alert('Restore Failed', err.message || 'No purchases found to restore.');
    } finally {
      setPurchasing(false);
    }
  };

  const getProductLabel = (pkg) => {
    const productId =
      pkg.product?.productIdentifier ?? pkg.product?.identifier ?? pkg.identifier ?? '';
    return CREDIT_LABELS[productId] ?? { credits: '?', label: productId };
  };

  const renderPackage = ({ item: pkg }) => {
    const { label } = getProductLabel(pkg);
    const price =
      pkg.product?.localizedPriceString ??
      pkg.product?.priceString ??
      '—';
    const productId =
      pkg.product?.productIdentifier ?? pkg.product?.identifier ?? pkg.identifier ?? '';
    const isSelected = productId === initialProductId;

    return (
      <TouchableOpacity
        style={[styles.packageRow, isSelected && styles.packageRowSelected]}
        onPress={() => handlePurchase(pkg)}
        disabled={purchasing}
        accessibilityRole="button"
        accessibilityLabel={`Buy ${label} for ${price}`}
      >
        <View style={styles.packageInfo}>
          <Text style={styles.packageLabel}>{label}</Text>
          <Text style={styles.packageSubLabel}>{productId}</Text>
        </View>
        <Text style={styles.packagePrice}>{price}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Buy Search Credits</Text>
          <Text style={styles.subtitle}>
            Credits are used to power AI-driven wager analysis.
          </Text>

          {loading && (
            <ActivityIndicator size="large" color="#1e3a5f" style={styles.spinner} />
          )}

          {error !== null && !loading && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={loadProducts} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading && error === null && packages.length === 0 && (
            <Text style={styles.emptyText}>
              No products available at this time. Please try again later.
            </Text>
          )}

          {!loading && packages.length > 0 && (
            <FlatList
              data={packages}
              keyExtractor={(item, index) =>
                item.product?.productIdentifier ?? String(index)
              }
              renderItem={renderPackage}
              style={styles.list}
              scrollEnabled={false}
            />
          )}

          {purchasing && (
            <View style={styles.purchasingOverlay}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.purchasingText}>Processing…</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={purchasing}
            accessibilityRole="button"
          >
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            disabled={purchasing}
            accessibilityRole="button"
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    minHeight: 300,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e3a5f',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  spinner: {
    marginVertical: 24,
  },
  list: {
    marginBottom: 16,
  },
  packageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginBottom: 10,
    backgroundColor: '#f8fafc',
  },
  packageRowSelected: {
    borderColor: '#1e3a5f',
    backgroundColor: '#eff6ff',
  },
  packageInfo: {
    flex: 1,
  },
  packageLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  packageSubLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  packagePrice: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e3a5f',
    marginLeft: 12,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 14,
    marginVertical: 16,
  },
  purchasingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30,58,95,0.75)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchasingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '600',
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  restoreButtonText: {
    color: '#1e3a5f',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  closeButton: {
    backgroundColor: '#1e3a5f',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
