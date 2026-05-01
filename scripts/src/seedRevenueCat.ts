import { getUncachableRevenueCatClient } from "./revenueCatClient";
import {
  listProjects, createProject,
  listApps, createApp,
  listAppPublicApiKeys,
  listProducts, createProduct,
  listEntitlements, createEntitlement, attachProductsToEntitlement,
  listOfferings, createOffering, updateOffering,
  listPackages, createPackages, attachProductsToPackage,
  type App, type Product, type Project, type Entitlement,
  type Offering, type Package, type CreateProductData,
} from "@replit/revenuecat-sdk";

const PROJECT_NAME         = "My Hero Kids Learning";
const ENTITLEMENT_ID       = "premium";
const ENTITLEMENT_NAME     = "Premium Access";
const OFFERING_ID          = "default";
const OFFERING_NAME        = "Default Offering";

// ── Products (3 plans) ───────────────────────────────────────────────────────
const PLANS = [
  {
    packageId:    "$rc_monthly",
    packageName:  "Monthly",
    productId:    "myhero_monthly",
    playProductId:"myhero_monthly:monthly",
    displayName:  "My Hero Monthly",
    title:        "My Hero Monthly Subscription",
    duration:     "P1M" as const,
    prices:       [{ amount_micros: 24990000, currency: "USD" }, { amount_micros: 22990000, currency: "EUR" }, { amount_micros: 19990000, currency: "GBP" }],
  },
  {
    packageId:    "$rc_six_month",
    packageName:  "6 Months",
    productId:    "myhero_6months",
    playProductId:"myhero_6months:sixmonths",
    displayName:  "My Hero 6-Month",
    title:        "My Hero 6-Month Subscription",
    duration:     "P6M" as const,
    prices:       [{ amount_micros: 135990000, currency: "USD" }, { amount_micros: 124990000, currency: "EUR" }, { amount_micros: 109990000, currency: "GBP" }],
  },
  {
    packageId:    "$rc_annual",
    packageName:  "Annual",
    productId:    "myhero_yearly",
    playProductId:"myhero_yearly:yearly",
    displayName:  "My Hero Annual",
    title:        "My Hero Annual Subscription",
    duration:     "P1Y" as const,
    prices:       [{ amount_micros: 236990000, currency: "USD" }, { amount_micros: 219990000, currency: "EUR" }, { amount_micros: 189990000, currency: "GBP" }],
  },
] as const;

const BUNDLE_ID   = "com.myheroapp.kids";
const PKG_NAME    = "com.myheroapp.kids";

type TestStorePricesResponse = { object: string; prices: { amount_micros: number; currency: string }[] };

async function seedRevenueCat() {
  const client = await getUncachableRevenueCatClient();

  // ── Project ────────────────────────────────────────────────────────────────
  let project: Project;
  const { data: projectList, error: listErr } = await listProjects({ client, query: { limit: 20 } });
  if (listErr) throw new Error("Failed to list projects");
  const existing = projectList.items?.find((p) => p.name === PROJECT_NAME);
  if (existing) {
    console.log("Project exists:", existing.id);
    project = existing;
  } else {
    const { data: p, error } = await createProject({ client, body: { name: PROJECT_NAME } });
    if (error) throw new Error("Failed to create project");
    console.log("Created project:", p.id);
    project = p;
  }

  // ── Apps ───────────────────────────────────────────────────────────────────
  const { data: apps, error: appsErr } = await listApps({ client, path: { project_id: project.id }, query: { limit: 20 } });
  if (appsErr || !apps?.items.length) throw new Error("No apps found");

  let testApp   = apps.items.find((a) => a.type === "test_store");
  let iosApp    = apps.items.find((a) => a.type === "app_store");
  let androidApp= apps.items.find((a) => a.type === "play_store");

  if (!testApp) throw new Error("Test store app not found — this should have been auto-created");

  if (!iosApp) {
    const { data, error } = await createApp({ client, path: { project_id: project.id }, body: { name: "My Hero iOS", type: "app_store", app_store: { bundle_id: BUNDLE_ID } } });
    if (error) throw new Error("Failed to create iOS app");
    iosApp = data;
    console.log("Created iOS app:", iosApp.id);
  }

  if (!androidApp) {
    const { data, error } = await createApp({ client, path: { project_id: project.id }, body: { name: "My Hero Android", type: "play_store", play_store: { package_name: PKG_NAME } } });
    if (error) throw new Error("Failed to create Android app");
    androidApp = data;
    console.log("Created Android app:", androidApp.id);
  }

  // ── Products ───────────────────────────────────────────────────────────────
  const { data: productList, error: prodListErr } = await listProducts({ client, path: { project_id: project.id }, query: { limit: 100 } });
  if (prodListErr) throw new Error("Failed to list products");

  const ensureProduct = async (targetApp: App, storeId: string, isTest: boolean, plan: typeof PLANS[number]): Promise<Product> => {
    const found = productList.items?.find((p) => p.store_identifier === storeId && p.app_id === targetApp.id);
    if (found) { console.log(`Product exists (${storeId}):`, found.id); return found; }
    const body: CreateProductData["body"] = {
      store_identifier: storeId,
      app_id: targetApp.id,
      type: "subscription",
      display_name: plan.displayName,
      ...(isTest ? { subscription: { duration: plan.duration }, title: plan.title } : {}),
    };
    const { data, error } = await createProduct({ client, path: { project_id: project.id }, body });
    if (error) throw new Error(`Failed to create product ${storeId}`);
    console.log(`Created product (${storeId}):`, data.id);
    return data;
  };

  const allProductIds: string[] = [];

  for (const plan of PLANS) {
    const testProd    = await ensureProduct(testApp,    plan.productId,    true,  plan);
    const iosProd     = await ensureProduct(iosApp,     plan.productId,    false, plan);
    const androidProd = await ensureProduct(androidApp, plan.playProductId,false, plan);

    // Add test store prices
    const { error: priceErr } = await client.post<TestStorePricesResponse>({
      url: "/projects/{project_id}/products/{product_id}/test_store_prices",
      path: { project_id: project.id, product_id: testProd.id },
      body: { prices: plan.prices },
    });
    if (priceErr && (priceErr as { type?: string }).type !== "resource_already_exists") {
      console.warn("Price error (non-fatal):", priceErr);
    }

    allProductIds.push(testProd.id, iosProd.id, androidProd.id);
  }

  // ── Entitlement ────────────────────────────────────────────────────────────
  const { data: entList, error: entListErr } = await listEntitlements({ client, path: { project_id: project.id }, query: { limit: 20 } });
  if (entListErr) throw new Error("Failed to list entitlements");
  let ent: Entitlement;
  const foundEnt = entList.items?.find((e) => e.lookup_key === ENTITLEMENT_ID);
  if (foundEnt) {
    ent = foundEnt;
    console.log("Entitlement exists:", ent.id);
  } else {
    const { data, error } = await createEntitlement({ client, path: { project_id: project.id }, body: { lookup_key: ENTITLEMENT_ID, display_name: ENTITLEMENT_NAME } });
    if (error) throw new Error("Failed to create entitlement");
    ent = data;
    console.log("Created entitlement:", ent.id);
  }

  const { error: attachEntErr } = await attachProductsToEntitlement({ client, path: { project_id: project.id, entitlement_id: ent.id }, body: { product_ids: allProductIds } });
  if (attachEntErr && (attachEntErr as { type?: string }).type !== "unprocessable_entity_error") throw new Error("Failed to attach products to entitlement");

  // ── Offering ───────────────────────────────────────────────────────────────
  const { data: offList, error: offListErr } = await listOfferings({ client, path: { project_id: project.id }, query: { limit: 20 } });
  if (offListErr) throw new Error("Failed to list offerings");
  let offering: Offering;
  const foundOff = offList.items?.find((o) => o.lookup_key === OFFERING_ID);
  if (foundOff) {
    offering = foundOff;
    console.log("Offering exists:", offering.id);
  } else {
    const { data, error } = await createOffering({ client, path: { project_id: project.id }, body: { lookup_key: OFFERING_ID, display_name: OFFERING_NAME } });
    if (error) throw new Error("Failed to create offering");
    offering = data;
    console.log("Created offering:", offering.id);
  }

  if (!offering.is_current) {
    const { error } = await updateOffering({ client, path: { project_id: project.id, offering_id: offering.id }, body: { is_current: true } });
    if (error) throw new Error("Failed to set offering as current");
    console.log("Set offering as current");
  }

  // ── Packages + attach products ─────────────────────────────────────────────
  const { data: pkgList, error: pkgListErr } = await listPackages({ client, path: { project_id: project.id, offering_id: offering.id }, query: { limit: 20 } });
  if (pkgListErr) throw new Error("Failed to list packages");

  for (const plan of PLANS) {
    let pkg: Package;
    const foundPkg = pkgList.items?.find((p) => p.lookup_key === plan.packageId);
    if (foundPkg) {
      pkg = foundPkg;
      console.log(`Package exists (${plan.packageId}):`, pkg.id);
    } else {
      const { data, error } = await createPackages({ client, path: { project_id: project.id, offering_id: offering.id }, body: { lookup_key: plan.packageId, display_name: plan.packageName } });
      if (error) throw new Error(`Failed to create package ${plan.packageId}`);
      pkg = data;
      console.log(`Created package (${plan.packageId}):`, pkg.id);
    }

    // Re-fetch products for this plan
    const { data: freshProducts } = await listProducts({ client, path: { project_id: project.id }, query: { limit: 100 } });
    const planTestId    = freshProducts?.items?.find((p) => p.store_identifier === plan.productId    && p.app_id === testApp!.id)?.id;
    const planIosId     = freshProducts?.items?.find((p) => p.store_identifier === plan.productId    && p.app_id === iosApp!.id)?.id;
    const planAndroidId = freshProducts?.items?.find((p) => p.store_identifier === plan.playProductId && p.app_id === androidApp!.id)?.id;

    const productAttachList = [planTestId, planIosId, planAndroidId].filter(Boolean).map((id) => ({ product_id: id!, eligibility_criteria: "all" as const }));

    const { error: attachPkgErr } = await attachProductsToPackage({ client, path: { project_id: project.id, package_id: pkg.id }, body: { products: productAttachList } });
    if (attachPkgErr && !(attachPkgErr as { type?: string }).type?.includes("unprocessable_entity")) {
      throw new Error(`Failed to attach products to package ${plan.packageId}`);
    }
  }

  // ── Print API keys ─────────────────────────────────────────────────────────
  const getKeys = async (app: App) => {
    const { data } = await listAppPublicApiKeys({ client, path: { project_id: project.id, app_id: app.id } });
    return data?.items?.map((i) => i.key).join(", ") ?? "N/A";
  };

  const testKey    = await getKeys(testApp);
  const iosKey     = await getKeys(iosApp);
  const androidKey = await getKeys(androidApp);

  console.log("\n============================================================");
  console.log("RevenueCat setup complete! Set these environment variables:");
  console.log("============================================================");
  console.log("REVENUECAT_PROJECT_ID              =", project.id);
  console.log("REVENUECAT_TEST_STORE_APP_ID       =", testApp.id);
  console.log("REVENUECAT_APPLE_APP_STORE_APP_ID  =", iosApp.id);
  console.log("REVENUECAT_GOOGLE_PLAY_STORE_APP_ID=", androidApp.id);
  console.log("EXPO_PUBLIC_REVENUECAT_TEST_API_KEY=", testKey);
  console.log("EXPO_PUBLIC_REVENUECAT_IOS_API_KEY =", iosKey);
  console.log("EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=", androidKey);
  console.log("============================================================\n");
}

seedRevenueCat().catch(console.error);
