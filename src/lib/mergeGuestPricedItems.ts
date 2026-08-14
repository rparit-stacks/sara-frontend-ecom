/**
 * Overlay server pricing-preview lines onto guest localStorage cart lines.
 * Display / checkout / order-submit must use these prices — never stale LS alone.
 */
export function mergeGuestPricedItems(local: any[], priced: any[] | null | undefined): any[] {
  if (!local?.length) return [];
  if (!priced || !Array.isArray(priced) || priced.length === 0) return local;
  return local.map((raw: any, idx: number) => {
    const match =
      priced.find((p: any) => p?.id != null && String(p.id) === String(raw.id)) ??
      priced[idx];
    if (!match) return raw;
    return {
      ...raw,
      unitPrice: match.unitPrice != null ? Number(match.unitPrice) : raw.unitPrice,
      fabricPrice: match.fabricPrice != null ? Number(match.fabricPrice) : raw.fabricPrice,
      designPrice: match.designPrice != null ? Number(match.designPrice) : raw.designPrice,
      totalPrice: match.totalPrice != null ? Number(match.totalPrice) : raw.totalPrice,
      discountSource: match.discountSource ?? raw.discountSource,
      combinedFabricMetres:
        match.combinedFabricMetres != null ? Number(match.combinedFabricMetres) : raw.combinedFabricMetres,
      baseFabricPerMeter:
        match.baseFabricPerMeter != null ? Number(match.baseFabricPerMeter) : raw.baseFabricPerMeter,
      fabricSlabDiscountPerMeter:
        match.fabricSlabDiscountPerMeter != null
          ? Number(match.fabricSlabDiscountPerMeter)
          : raw.fabricSlabDiscountPerMeter,
      effectiveFabricPerMeter:
        match.effectiveFabricPerMeter != null
          ? Number(match.effectiveFabricPerMeter)
          : raw.effectiveFabricPerMeter,
      breakdown: match.breakdown ?? raw.breakdown,
    };
  });
}

/** Map priced cart lines to CreateOrderRequest.guestCartItems shape. */
export function toGuestOrderItems(lines: any[]) {
  return (lines || []).map((item: any) => ({
    productType: item.productType,
    productId: item.productId,
    productName: item.productName,
    productImage: item.productImage,
    designId: item.designId,
    fabricId: item.fabricId,
    fabricPrice: item.fabricPrice,
    designPrice: item.designPrice,
    uploadedDesignUrl: item.uploadedDesignUrl,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    variants: item.variants || {},
    variantSelections: item.variantSelections || undefined,
    customFormData: item.customFormData || {},
  }));
}
