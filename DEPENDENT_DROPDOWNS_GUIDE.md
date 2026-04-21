# Dependent Dropdowns Implementation Guide

## API Structure

```
GET /api/category-brand/list

Response:
[
  {
    "primary_id": 1,
    "primary_name": "Electronics",
    "secondaries": [
      {
        "secondary_id": 10,
        "secondary_name": "Mobile Phones",
        "brands": [
          { "brand_id": 100, "brand_name": "Samsung" },
          { "brand_id": 101, "brand_name": "Apple" }
        ]
      },
      {
        "secondary_id": 11,
        "secondary_name": "Laptops",
        "brands": [
          { "brand_id": 102, "brand_name": "Dell" },
          { "brand_id": 103, "brand_name": "HP" }
        ]
      }
    ]
  }
]
```

## Implementation Steps

### 1. Context Setup (Already Done)

The `MappingContext` now provides:
- `categoryData`: Hierarchical structure (Primary → Secondary → Brand)
- `mappings`: Flat structure for backward compatibility
- `loading`: Loading state
- `refreshMappings()`: Refresh function

### 2. Component State

```tsx
const [formData, setFormData] = useState({
    primary_id: "",
    secondary_id: "",
    brand_id: "",
});
```

### 3. Extract Options with useMemo

```tsx
// Primary options (always available)
const primaryOptions = useMemo(() => {
    return categoryData.map(primary => ({
        value: primary.primary_id,
        label: primary.primary_name,
    }));
}, [categoryData]);

// Secondary options (filtered by primary)
const secondaryOptions = useMemo(() => {
    if (!formData.primary_id) return [];
    
    const selectedPrimary = categoryData.find(
        p => p.primary_id === Number(formData.primary_id)
    );
    
    return selectedPrimary?.secondaries?.map(secondary => ({
        value: secondary.secondary_id,
        label: secondary.secondary_name,
    })) || [];
}, [categoryData, formData.primary_id]);

// Brand options (filtered by secondary)
const brandOptions = useMemo(() => {
    if (!formData.primary_id || !formData.secondary_id) return [];
    
    const selectedPrimary = categoryData.find(
        p => p.primary_id === Number(formData.primary_id)
    );
    
    const selectedSecondary = selectedPrimary?.secondaries?.find(
        s => s.secondary_id === Number(formData.secondary_id)
    );
    
    return selectedSecondary?.brands?.map(brand => ({
        value: brand.brand_id,
        label: brand.brand_name,
    })) || [];
}, [categoryData, formData.primary_id, formData.secondary_id]);
```

### 4. Handle Changes with Cascading Reset

```tsx
const handlePrimaryChange = (value: string) => {
    setFormData({
        primary_id: value,
        secondary_id: "", // Reset
        brand_id: "",     // Reset
    });
};

const handleSecondaryChange = (value: string) => {
    setFormData(prev => ({
        ...prev,
        secondary_id: value,
        brand_id: "", // Reset
    }));
};

const handleBrandChange = (value: string) => {
    setFormData(prev => ({
        ...prev,
        brand_id: value,
    }));
};
```

### 5. Auto-Select for Edit Mode

When editing a product, the API returns:
```json
{
  "mappings": [
    {
      "mapping_id": 123,
      "category_id": 10,  // This is actually secondary_id
      "brand_id": 100
    }
  ]
}
```

**Implementation:**

```tsx
const autoSelectFromMapping = (mappingData: { category_id: number; brand_id: number }) => {
    // Find which primary contains this secondary
    let foundPrimary = null;
    let foundSecondary = null;

    for (const primary of categoryData) {
        const secondary = primary.secondaries?.find(
            s => s.secondary_id === mappingData.category_id
        );
        if (secondary) {
            foundPrimary = primary;
            foundSecondary = secondary;
            break;
        }
    }

    if (foundPrimary && foundSecondary) {
        // Set in correct order
        setFormData({
            primary_id: String(foundPrimary.primary_id),
            secondary_id: String(foundSecondary.secondary_id),
            brand_id: String(mappingData.brand_id),
        });
    }
};

// Call this after fetching product data
useEffect(() => {
    const loadProductData = async () => {
        const product = await getProductById(id);
        
        // Wait for categoryData to be available
        if (categoryData.length > 0 && product.mappings?.[0]) {
            autoSelectFromMapping({
                category_id: product.mappings[0].category_id,
                brand_id: product.mappings[0].brand_id,
            });
        }
    };
    
    if (id && categoryData.length > 0) {
        loadProductData();
    }
}, [id, categoryData]);
```

### 6. JSX Template

```tsx
{/* PRIMARY CATEGORY */}
<select
    value={formData.primary_id}
    onChange={(e) => handlePrimaryChange(e.target.value)}
    required
>
    <option value="">Select Primary Category</option>
    {primaryOptions.map(option => (
        <option key={option.value} value={option.value}>
            {option.label}
        </option>
    ))}
</select>

{/* SECONDARY CATEGORY */}
<select
    value={formData.secondary_id}
    onChange={(e) => handleSecondaryChange(e.target.value)}
    disabled={!formData.primary_id || secondaryOptions.length === 0}
    required
>
    <option value="">Select Secondary Category</option>
    {secondaryOptions.map(option => (
        <option key={option.value} value={option.value}>
            {option.label}
        </option>
    ))}
</select>

{/* BRAND */}
<select
    value={formData.brand_id}
    onChange={(e) => handleBrandChange(e.target.value)}
    disabled={!formData.secondary_id || brandOptions.length === 0}
    required
>
    <option value="">Select Brand</option>
    {brandOptions.map(option => (
        <option key={option.value} value={option.value}>
            {option.label}
        </option>
    ))}
</select>
```

### 7. Form Submission

When submitting (Add/Edit Product):

```tsx
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
        product_name: formData.product_name,
        // ... other fields
        
        // Send the IDs
        primary_category: formData.primary_id,
        secondary_category: formData.secondary_id,
        brand: formData.brand_id,
        
        // Or if backend expects different format:
        category_id: formData.secondary_id,  // Backend uses category_id for secondary
        brand_id: formData.brand_id,
    };
    
    await createProduct(payload);
};
```

## Key Points

1. **Controlled Inputs**: Always use `value={formData.xxx}` for controlled components
2. **Cascading Reset**: Changing parent always resets children
3. **Disabled State**: Child dropdowns disabled when parent not selected
4. **Auto-Selection Order**: Set primary → secondary → brand (in that order)
5. **ID Matching**: Always use numeric IDs, convert to string for select values
6. **Empty Checks**: Handle cases where secondaries or brands might be empty arrays

## Common Pitfalls

❌ **Don't do this:**
```tsx
// Setting all at once without order
setFormData({
    primary_id: "1",
    secondary_id: "10",
    brand_id: "100",
});
```

✅ **Do this instead:**
```tsx
// Set primary first, then secondary, then brand
// Or use the autoSelectFromMapping function
```

❌ **Don't do this:**
```tsx
// Using name matching
const primary = categoryData.find(p => p.primary_name === "Electronics");
```

✅ **Do this instead:**
```tsx
// Always use ID matching
const primary = categoryData.find(p => p.primary_id === Number(formData.primary_id));
```

## Testing Checklist

- [ ] Primary dropdown shows all primaries on load
- [ ] Secondary dropdown is disabled when no primary selected
- [ ] Secondary dropdown populates when primary selected
- [ ] Brand dropdown is disabled when no secondary selected
- [ ] Brand dropdown populates when secondary selected
- [ ] Changing primary resets secondary and brand
- [ ] Changing secondary resets brand
- [ ] Edit mode auto-selects all three dropdowns correctly
- [ ] Form submission sends correct IDs
- [ ] Empty states handled gracefully
