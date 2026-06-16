import { Routes, Route, Outlet } from "react-router-dom";
import LandingPage from "./pages/dashboard/Landingpage";
import SectorTitleList from "./pages/sectortitle/viewsectortitle/SectorTitleList";
import Layout from "./layouts/Layout";
import Menu from "./pages/settings/menu_section/menu/Menu";
import ViewMenuList from "./pages/settings/menu_section/menu/ViewMenuList";
import ViewMenuPages from "./pages/settings/menu_section/menupage/ViewMenuPages";
import AddMenuPage from "./pages/settings/menu_section/menupage/AddMenuPage";
import MenuTitlePage from "./pages/settings/menu_section/menutitle/MenuTitlePage";
import MenuMappingPage from "./pages/settings/menu_section/menumapping/MenuMappingPage";
import AddMenuMapping from "./pages/settings/menu_section/menumapping/AddMenuMapping";
import EditMenuMapping from "./pages/settings/menu_section/menumapping/EditMenuMapping";
import AddSectorTitle from "./pages/sectortitle/addsectortitle/AddSectorTitle";
import AddSectorTitlefield from "./pages/sectortitle/addsectortitlefield/AddSectorTitlefield";
import AddSector from "./pages/sector/addsector/AddSector";
import ViewSectors from "./pages/sector/viewsectors/ViewSectors";
import AddSectorMapping from "./pages/sector/addsectormapping/AddSectorMapping";
import SectorTitlefield from "./pages/sector/sectortitlefield/SectorTitlefield";
import AddSubSector from "./pages/subsector/view/AddSubSector";
import ViewSubSectors from "./pages/subsector/view/ViewSubSectors";
import AddSubSectorMapping from "./pages/subsector/view/AddSubSectorMapping";
import AddPrimaryCategory from "./pages/category/views/AddPrimaryCategory";
import ViewCategoryList from "./pages/category/views/ViewCategoryList";
import ManageCategory from "./pages/category/views/ManageCategory";
import ViewUnselectCategoryList from "./pages/category/views/ViewUnselectCategoryList";
import PrimarySecondaryCategoryMapping from "./pages/category/views/PrimarySecondaryCategoryMapping";
import SectorGSTConfig from "./pages/category/views/SectorGSTConfig";
import CategoryTax from "./pages/category/views/CategoryTax";
import AddBrand from "./pages/brand/addbrand/AddBrand";
import ViewBrandList from "./pages/brand/viewbrandlist/ViewBrandList";
import EditSectorTitle from "./pages/sectortitle/editsectortitle/EditSectorTitle";
import EditSector from "./pages/sector/editsector/EditSector";
import EditSubSector from "./pages/subsector/view/EditSubSector";
import EditCategory from "./pages/category/views/EditCategory";
import EditBrand from "./pages/brand/editbrand/EditBrand";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ProtectedRoute from "./components/protectedroute/ProtectedRoute";
import AddCategoryBrand from "./pages/brand/categorybrandmapping/addcategorybrand/AddCategoryBrand";
import ManageCategoryBrand from "./pages/brand/categorybrandmapping/managecategorybrand/ManageCategoryBrand";
// import ViewCategoryBrand from "./pages/brand/categorybrandmapping/viewcategorybrand/ViewCategoryBrand";

/* PRODUCT IMPORTS */
import AddProduct from "./pages/product/addproduct/AddProduct";
import ViewProduct from "./pages/product/viewproduct/ViewProduct";
import EditProduct from "./pages/product/editproduct/EditProduct";
import UpdateMRP from "./pages/product/updatemrp/UpdateMRP";
import ProductMapping from "./pages/product/productmapping/ProductMapping";
import ProductTax from "./pages/product/views/ProductTax";
// import SectorSettingsPage from "./pages/settings/sector_section/SectorSettingsPage";
import DynamicFormCreator from "./pages/settings/dynamic_section/DynamicFormCreator";
import PageCreation from "./pages/settings/dynamic_section/PageCreation";
import AddWebsite from "./pages/website/addwebsite/AddWebsite";
import ViewWebsiteList from "./pages/website/viewwebsitelist/ViewWebsiteList";
import EditWebsite from "./pages/website/editwebsite/EditWebsite";
import AddColour from "./pages/variant/addcolour/AddColour";
import ViewColourList from "./pages/variant/viewcolour/ViewColourList";
import EditColour from "./pages/variant/editcolour/EditColour";
import AddVariant from "./pages/variant/addvariant/AddVariant";
import ViewVariantList from "./pages/variant/viewvariant/ViewVariantList";
import AddField from "./pages/variant/addfield/AddField";
import ViewFieldList from "./pages/variant/viewfield/ViewFieldList";
import AddUnitType from "./pages/variant/addunittype/AddUnitType";
import ViewUnitTypeList from "./pages/variant/viewunittype/ViewUnitTypeList";
import AddTax from "./pages/variant/addtax/AddTax";
import ViewTaxList from "./pages/variant/viewtax/ViewTaxList";
import EditTax from "./pages/variant/edittax/EditTax";
import DiscountManagement from "./pages/variant/discount/DiscountManagement";
import OfferManagement from "./pages/variant/offer/OfferManagement";

import CategoryField from "./pages/category/categoryfield/CategoryField";

/* MULTITAB IMPORTS */
import MultitabMenus from "./pages/settings/multitab/MultitabMenus";
import MultitabTabs from "./pages/settings/multitab/MultitabTabs";
import MultitabCheckboxes from "./pages/settings/multitab/MultitabCheckboxes";
import MultitabMappings from "./pages/settings/multitab/MultitabMappings";
import MultitabPreview from "./pages/settings/multitab/MultitabPreview";

import CategoryGroupView from "./pages/category-group/view/view";
import AddCategoryGroup from "./pages/category-group/add/addcategorygroup";
import EditCategoryGroup from "./pages/category-group/edit/editcategorygroup";
import CreateCategoryTitle from "./pages/category-group/create-category-title/cc";
import CategoryMapping from "./pages/category-group/mapping/CategoryMapping";



/* ZUSTAND DEMO PAGES */
import SelectBusiness from "./pages/demo/SelectBusiness";
import DashboardDemo from "./pages/demo/Dashboard";
import ProductsDemo from "./pages/demo/Products";

import { useEffect } from "react";
import { MappingProvider } from "./context/MappingContext";

function App() {

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      console.log("🎟️ URL Token detected, applying session...");
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify({ id: 2, email: "kavinbk035@gmail.com" }));

      // Clean URL and refresh to apply
      const cleanUrl = window.location.origin + window.location.pathname;
      window.location.href = cleanUrl;
    }
  }, []);

  return (
    <Routes>
      {/* AUTHENTICATION */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* LAYOUT - PROTECTED ROUTES */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/sector-titles" element={<SectorTitleList />} />
          <Route path="/sector-titles/add" element={<AddSectorTitle />} />
          <Route path="/sector-title-field/add" element={<AddSectorTitlefield />} />
          <Route path="/sector/add" element={<AddSector />} />
          <Route path="/sector" element={<ViewSectors />} />
          <Route path="/sector-mapping" element={<AddSectorMapping />} />
          <Route path="/sector-title-field" element={<SectorTitlefield />} />
          <Route path="/sector-title/edit/:id" element={<EditSectorTitle />} />
          <Route path="/edit-sector/:id" element={<EditSector />} />

          {/* -------------------subsector------------- */}
          <Route path="/subsector/add" element={<AddSubSector />} />
          <Route path="/subsector" element={<ViewSubSectors />} />
          <Route path="/subsector-mapping" element={<AddSubSectorMapping />} />
          <Route path="/sub-sectors/edit/:id" element={<EditSubSector />} />

          {/* ----------------------category------- */}
          <Route path="/category/add" element={<AddPrimaryCategory />} />
          <Route path="/categories" element={<ViewCategoryList />} />
          <Route path="/manage-category" element={<ManageCategory />} />
          <Route path="/unselect-categories" element={<ViewUnselectCategoryList />} />
          <Route path="/categories/edit/:id?" element={<EditCategory />} />
          <Route path="/category-field" element={<CategoryField />} />

          {/* ----------------------category group------- */}
          <Route path="/category-groups" element={<CategoryGroupView />} />
          <Route path="/category-groups/add" element={<AddCategoryGroup />} />
          <Route path="/category-groups/edit/:id" element={<EditCategoryGroup />} />
          <Route path="/category-groups/create-title" element={<CreateCategoryTitle />} />
          <Route path="/category-groups/mapping" element={<CategoryMapping />} />




          <Route
            path="/primary-secondary-category-mapping"
            element={<PrimarySecondaryCategoryMapping />}
          />
          <Route path="/sector-gst-config" element={<SectorGSTConfig />} />
          <Route path="/category/tax" element={<CategoryTax />} />
          <Route path="/brands/add" element={<AddBrand />} />
          <Route path="/brands" element={<ViewBrandList />} />
          <Route path="/brands/edit/:id" element={<EditBrand />} />

          {/* CATEGORY BRAND MAPPING & PRODUCTS REQUIRING CONTEXT */}
          <Route element={<MappingProvider><Outlet /></MappingProvider>}>
            <Route path="/add-category-brand" element={<AddCategoryBrand />} />
            <Route path="/manage-category-brand" element={<ManageCategoryBrand />} />
            <Route path="/product/add" element={<AddProduct />} />
            <Route path="/products/edit/:id" element={<EditProduct />} />
            <Route path="/demo/products" element={<ProductsDemo />} />
          </Route>

          {/* PRODUCT ROUTES */}
          <Route path="/products" element={<ViewProduct />} />
          <Route path="/product/update-mrp" element={<UpdateMRP />} />
          <Route path="/product/tax" element={<ProductTax />} />
          <Route path="/product-mapping" element={<ProductMapping />} />

          {/* WEBSITE ROUTES */}
          <Route path="/website/add" element={<AddWebsite />} />
          <Route path="/websites" element={<ViewWebsiteList />} />
          <Route path="/website/edit/:id" element={<EditWebsite />} />

          {/* VARIANT FIELD ROUTES */}
          <Route path="/variant/add-colour" element={<AddColour />} />
          <Route path="/variant/view-colour" element={<ViewColourList />} />
          <Route path="/variant/edit-colour/:id" element={<EditColour />} />
          <Route path="/variant/view-variant" element={<ViewVariantList />} />
          <Route path="/variant/add-variant" element={<AddVariant />} />
          <Route path="/variant/add-field" element={<AddField />} />
          <Route path="/variant/view-field" element={<ViewFieldList />} />
          <Route path="/variant/add-unit-type" element={<AddUnitType />} />
          <Route path="/variant/view-unit-type" element={<ViewUnitTypeList />} />
          <Route path="/variant/add-tax" element={<AddTax />} />
          <Route path="/variant/view-tax" element={<ViewTaxList />} />
          <Route path="/variant/edit-tax/:id" element={<EditTax />} />
          <Route path="/variant/discount-management" element={<DiscountManagement />} />
          <Route path="/variant/offer-management" element={<OfferManagement />} />



          {/* SETTINGS */}

          <Route path="/settings/menu-title" element={<MenuTitlePage />} />
          <Route path="/settings/menu" element={<ViewMenuList />} />
          <Route path="/settings/menu/add" element={<Menu />} />
          <Route path="/settings/menu/edit/:id" element={<Menu />} />
          <Route path="/settings/menu-pages" element={<ViewMenuPages />} />
          <Route path="/settings/menu-pages/add" element={<AddMenuPage />} />
          <Route path="/settings/menu-pages/edit/:id" element={<AddMenuPage />} />
          <Route path="/settings/menu-mapping" element={<MenuMappingPage />} />
          <Route path="/settings/menu-mapping/add" element={<AddMenuMapping />} />
          <Route path="/settings/menu-mapping/edit/:id" element={<EditMenuMapping />} />
          {/* <Route path="/settings/sector-settings" element={<SectorSettingsPage />} /> */}
          <Route path="/settings/page-creation" element={<PageCreation />} />
          <Route path="/settings/dynamic-form-creator" element={<DynamicFormCreator />} />

          {/* NEW MULTITAB SYSTEM */}
          <Route path="/settings/multitab/menu" element={<MultitabMenus />} />
          <Route path="/settings/multitab/tab-heading" element={<MultitabTabs />} />
          <Route path="/settings/multitab/checkbox" element={<MultitabCheckboxes />} />
          <Route path="/settings/multitab/mapping" element={<MultitabMappings />} />
          <Route path="/settings/multitab/preview" element={<MultitabPreview />} />




          {/* ZUSTAND DEMO ROUTES */}
          <Route path="/demo/select-business" element={<SelectBusiness />} />
          <Route path="/demo/dashboard" element={<DashboardDemo />} />



        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<h2>Page Not Found</h2>} />
    </Routes>
  );
}

export default App;
