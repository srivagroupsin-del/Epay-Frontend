import os
import shutil

src_root = r"e:\Hari\frontend-react\epay_recharge\src"
old_pages_root = os.path.join(src_root, "Pages", "Dashboard", "SideBar_pages")
new_pages_root = os.path.join(src_root, "pages")

mapping = {
    "Brand": "brand",
    "Category": "category",
    "Product": "product",
    "Sector": "sector",
    "Sectortitle": "sectortitle",
    "Settings": "settings",
    "Subsector": "subsector",
    "SubsectorMultitab": "subsector-multitab",
    "Variant": "variant",
    "Website": "website",
    "MultitabModule": "multitab-module",
    "Admin": "admin"
}

# Ensure new pages root exists
if not os.path.exists(new_pages_root):
    os.makedirs(new_pages_root)

for old_name, new_name in mapping.items():
    old_path = os.path.join(old_pages_root, old_name)
    new_path = os.path.join(new_pages_root, new_name)
    
    if os.path.exists(old_path):
        print(f"Moving {old_path} to {new_path}")
        if os.path.exists(new_path):
            # If destination exists, we might need to merge or delete it if it's empty
            shutil.rmtree(new_path)
        shutil.move(old_path, new_path)
    else:
        print(f"Source not found: {old_path}")

# Handle Authentication and LandingPage
auth_old = os.path.join(src_root, "Pages", "Authentication")
auth_new = os.path.join(new_pages_root, "auth")
if os.path.exists(auth_old):
    if os.path.exists(auth_new): shutil.rmtree(auth_new)
    shutil.move(auth_old, auth_new)

landing_old = os.path.join(src_root, "Pages", "LandingPage")
landing_new = os.path.join(new_pages_root, "dashboard") # Moved LandingPage to dashboard/home
if os.path.exists(landing_old):
    if not os.path.exists(landing_new):
        os.makedirs(landing_new)
    # Move contents of LandingPage to dashboard
    for item in os.listdir(landing_old):
        s = os.path.join(landing_old, item)
        d = os.path.join(landing_new, item)
        if os.path.exists(d): 
             if os.path.isdir(d): shutil.rmtree(d)
             else: os.remove(d)
        shutil.move(s, d)

# Handle Layouts
layout_old = os.path.join(src_root, "Pages", "Main_Layout")
layout_new = os.path.join(src_root, "layouts")
if os.path.exists(layout_old):
    if os.path.exists(layout_new): shutil.rmtree(layout_new)
    shutil.move(layout_old, layout_new)

print("Restructuring complete.")
