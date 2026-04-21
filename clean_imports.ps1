
$files = @(
    "src\Pages\Dashboard\SideBar_pages\Subsector\view\EditSubSector.tsx",
    "src\Pages\Dashboard\SideBar_pages\Subsector\view\AddSubSector.tsx",
    "src\Pages\Dashboard\SideBar_pages\Settings\Sector_title_multitab\AddSectorTitle\AddSectorTitle.tsx",
    "src\Pages\Dashboard\SideBar_pages\Settings\Menu_Section\Menupage\AddMenuPage.tsx",
    "src\Pages\Dashboard\SideBar_pages\Settings\Menu_Section\MenuMapping\EditMenuMapping.tsx",
    "src\Pages\Dashboard\SideBar_pages\Settings\Menu_Section\MenuMapping\AddMenuMapping.tsx",
    "src\Pages\Dashboard\SideBar_pages\Sectortitle\EditSectorTitle\EditSectorTitle.tsx",
    "src\Pages\Dashboard\SideBar_pages\Sectortitle\AddSectorTitle\AddSectorTitle.tsx",
    "src\Pages\Dashboard\SideBar_pages\Product\EditProduct\EditProduct.tsx",
    "src\Pages\Dashboard\SideBar_pages\Product\AddProduct\AddProduct.tsx",
    "src\Pages\Dashboard\SideBar_pages\Category\views\EditCategory.tsx",
    "src\Pages\Dashboard\SideBar_pages\Category\views\AddPrimaryCategory.tsx",
    "src\Pages\Dashboard\SideBar_pages\Brand\EditBrand\EditBrand.tsx",
    "src\Pages\Dashboard\SideBar_pages\Brand\AddBrand\AddBrand.tsx"
)

foreach ($file in $files) {
    $path = Join-Path "c:\Users\ADMIN\OneDrive\Desktop\epay_recharge\epay_recharge" $file
    if (Test-Path $path) {
        (Get-Content $path) | Where-Object { 
            $_ -notmatch "sector-title-form.css" -and $_ -notmatch "inline-form.css" 
        } | Set-Content $path
        Write-Host "Cleaned $file"
    } else {
        Write-Host "File not found: $path"
    }
}
