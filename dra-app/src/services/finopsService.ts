import { FinOpsLineItem, FinOpsSummary } from '../types';
import { ParsedResourceBlock } from './staticAnalyzer';

/**
 * Regional GCP Cloud Billing Catalog Baseline Rates (On-Demand USD/month @ 730 hrs)
 * Enables deterministic FinOps baseline spend & right-sizing calculations without guesswork.
 */
const REGION_MULTIPLIER: Record<string, number> = {
  'us-central1': 1.0,
  'us-east1': 1.0,
  'us-east4': 1.11,
  'us-west1': 1.0,
  'us-west2': 1.2,
  'europe-west1': 1.1,
  'europe-west2': 1.24,
  'europe-west3': 1.24,
  'europe-west4': 1.1,
  'asia-east1': 1.16,
  'asia-northeast1': 1.28,
  'asia-southeast1': 1.18
};

const MACHINE_MONTHLY_USD: Record<string, { usd: number; optimizedUsd: number; tip: string }> = {
  'f1-micro': { usd: 5.55, optimizedUsd: 5.55, tip: 'Consider e2-micro free-tier eligible SKU.' },
  'g1-small': { usd: 18.8, optimizedUsd: 12.23, tip: 'Migrate legacy g1-small to e2-small (~35% savings).' },
  'e2-micro': { usd: 6.11, optimizedUsd: 6.11, tip: 'Right-sized economy instance; apply 1yr CUD if steady-state.' },
  'e2-small': { usd: 12.23, optimizedUsd: 12.23, tip: 'Apply 1yr Resource CUD (~28% savings) for 24/7 workloads.' },
  'e2-medium': { usd: 24.46, optimizedUsd: 17.61, tip: 'Enable Spot VM for non-prod or 1-year CUD (~28% savings).' },
  'e2-standard-2': { usd: 48.92, optimizedUsd: 35.22, tip: 'Apply 1-year Committed Use Discount or scale to zero on Cloud Run.' },
  'e2-standard-4': { usd: 97.83, optimizedUsd: 70.44, tip: 'Right-size vCPU utilization or apply 1-year CUD (~28% savings).' },
  'e2-standard-8': { usd: 195.66, optimizedUsd: 140.88, tip: 'Evaluate Spot VMs for batch workloads or 1-year CUD.' },
  'n1-standard-1': { usd: 34.68, optimizedUsd: 24.46, tip: 'Migrate legacy N1 to e2-medium / c4a-standard-1 (~30% savings).' },
  'n1-standard-2': { usd: 69.35, optimizedUsd: 48.92, tip: 'Migrate legacy N1 to e2-standard-2 (~30% savings).' },
  'n1-standard-4': { usd: 138.7, optimizedUsd: 97.83, tip: 'Migrate legacy N1 to e2-standard-4 or Axion c4a-standard-4 (~30% savings).' },
  'n1-standard-8': { usd: 277.4, optimizedUsd: 195.66, tip: 'Migrate legacy N1 to e2-standard-8 or n4-standard-8 (~30% savings).' },
  'n2-standard-2': { usd: 70.9, optimizedUsd: 52.0, tip: 'Evaluate E2/C4A generation or 1-year CUD.' },
  'n2-standard-4': { usd: 141.8, optimizedUsd: 102.1, tip: 'Evaluate Axion c4a-standard-4 (~28% better price-performance).' },
  'n2-standard-8': { usd: 283.6, optimizedUsd: 204.2, tip: 'Evaluate Axion c4a-standard-8 or 3-year CUD.' }
};

const DISK_GB_MONTHLY_USD: Record<string, number> = {
  'pd-standard': 0.04,
  'pd-balanced': 0.1,
  'pd-ssd': 0.17,
  'pd-extreme': 0.125,
  'hyperdisk-balanced': 0.08
};

const SQL_TIER_MONTHLY_USD: Record<string, { usd: number; optimizedUsd: number; tip: string }> = {
  'db-f1-micro': { usd: 9.37, optimizedUsd: 9.37, tip: 'Shared-core dev tier.' },
  'db-g1-small': { usd: 27.25, optimizedUsd: 27.25, tip: 'Shared-core small tier.' },
  'db-custom-2-7680': { usd: 118.5, optimizedUsd: 88.8, tip: 'Apply Cloud SQL 1-year CUD (~25% savings).' },
  'db-custom-4-15360': { usd: 237.0, optimizedUsd: 177.75, tip: 'Apply Cloud SQL 1-year CUD (~25% savings) & review read-replica idle load.' },
  'db-n1-standard-2': { usd: 135.2, optimizedUsd: 98.5, tip: 'Migrate legacy db-n1 tier to Cloud SQL Enterprise custom vCPU + CUD.' },
  'db-n1-standard-4': { usd: 270.4, optimizedUsd: 196.0, tip: 'Migrate legacy db-n1 tier to custom vCPU + 1yr CUD (~27% savings).' }
};

const parseCountMultiplier = (rawText: string): number => {
  const countMatch = rawText.match(/\bcount\s*=\s*(\d+)/);
  if (countMatch) {
    const parsed = parseInt(countMatch[1], 10);
    if (parsed >= 0 && parsed <= 1000) return parsed;
  }
  return 1;
};

export const calculateFinOpsSummary = (
  blocks: ParsedResourceBlock[],
  defaultRegion = 'us-central1'
): FinOpsSummary => {
  const mult = REGION_MULTIPLIER[defaultRegion] ?? 1.05;
  const lineItems: FinOpsLineItem[] = [];

  const attachedDiskNames = new Set<string>();
  for (const b of blocks) {
    if (b.resourceType === 'google_compute_instance' || b.resourceType === 'google_compute_attached_disk') {
      const refs = b.rawText.match(/google_compute_disk\.([a-zA-Z0-9_-]+)/g) || [];
      refs.forEach((r) => attachedDiskNames.add(r.split('.')[1]));
    }
  }

  for (const b of blocks) {
    if (b.blockType !== 'resource') continue;
    const count = parseCountMultiplier(b.rawText);
    if (count === 0) continue;

    if (b.resourceType === 'google_compute_instance') {
      const mtMatch = b.rawText.match(/machine_type\s*=\s*"([^"]+)"/);
      const mt = mtMatch ? mtMatch[1] : 'e2-medium';
      const sku = MACHINE_MONTHLY_USD[mt] || {
        usd: 65.0,
        optimizedUsd: 48.0,
        tip: 'Evaluate Committed Use Discounts (28–55% savings) and rightsizing.'
      };
      const hasPublicIp = /access_config\s*\{/.test(b.rawText);
      const ipCost = hasPublicIp ? 3.65 : 0;

      const currentMonthlyUsd = Number(((sku.usd + ipCost) * mult * count).toFixed(2));
      const optimizedMonthlyUsd = Number((sku.optimizedUsd * mult * count).toFixed(2));
      const savingsMonthlyUsd = Number(Math.max(0, currentMonthlyUsd - optimizedMonthlyUsd).toFixed(2));

      lineItems.push({
        resourceAddress: b.address,
        resourceType: b.resourceType,
        skuDescription: `Compute VM (${mt}${hasPublicIp ? ' + External IPv4' : ''})`,
        region: defaultRegion,
        count,
        currentMonthlyUsd,
        optimizedMonthlyUsd,
        savingsMonthlyUsd,
        recommendation: hasPublicIp ? `${sku.tip} Remove external IPv4 ($3.65/mo/IP).` : sku.tip,
        fileName: b.fileName,
        lineNumber: b.startLine
      });
    } else if (b.resourceType === 'google_compute_disk') {
      const typeMatch = b.rawText.match(/type\s*=\s*"([^"]+)"/);
      const sizeMatch = b.rawText.match(/size\s*=\s*(\d+)/);
      const diskType = typeMatch ? typeMatch[1] : 'pd-balanced';
      const sizeGb = sizeMatch ? parseInt(sizeMatch[1], 10) : 100;
      const rate = DISK_GB_MONTHLY_USD[diskType] ?? 0.1;
      const isAttached = attachedDiskNames.has(b.resourceName);

      const currentMonthlyUsd = Number((sizeGb * rate * mult * count).toFixed(2));
      const optRate = !isAttached ? 0.02 : diskType === 'pd-ssd' ? 0.08 : rate;
      const optimizedMonthlyUsd = Number((sizeGb * optRate * mult * count).toFixed(2));
      const savingsMonthlyUsd = Number(Math.max(0, currentMonthlyUsd - optimizedMonthlyUsd).toFixed(2));

      lineItems.push({
        resourceAddress: b.address,
        resourceType: b.resourceType,
        skuDescription: `Persistent Disk (${diskType}, ${sizeGb} GB${!isAttached ? ', Unattached' : ''})`,
        region: defaultRegion,
        count,
        currentMonthlyUsd,
        optimizedMonthlyUsd,
        savingsMonthlyUsd,
        recommendation: !isAttached
          ? 'Unattached zombie disk — snapshot ($0.026/GB) and delete volume.'
          : diskType === 'pd-ssd'
            ? 'Evaluate hyperdisk-balanced or pd-balanced unless >15k IOPS required.'
            : 'Balanced block storage tier.',
        fileName: b.fileName,
        lineNumber: b.startLine
      });
    } else if (b.resourceType === 'google_sql_database_instance') {
      const tierMatch = b.rawText.match(/tier\s*=\s*"([^"]+)"/);
      const tier = tierMatch ? tierMatch[1] : 'db-custom-2-7680';
      const isRegional = /availability_type\s*=\s*"REGIONAL"/.test(b.rawText);
      const haMult = isRegional ? 2.0 : 1.0;
      const sku = SQL_TIER_MONTHLY_USD[tier] || {
        usd: 118.5,
        optimizedUsd: 88.8,
        tip: 'Apply Cloud SQL 1-year Committed Use Discount (~25% savings).'
      };

      const currentMonthlyUsd = Number((sku.usd * haMult * mult * count).toFixed(2));
      const optimizedMonthlyUsd = Number((sku.optimizedUsd * haMult * mult * count).toFixed(2));
      const savingsMonthlyUsd = Number(Math.max(0, currentMonthlyUsd - optimizedMonthlyUsd).toFixed(2));

      lineItems.push({
        resourceAddress: b.address,
        resourceType: b.resourceType,
        skuDescription: `Cloud SQL (${tier}, ${isRegional ? 'Regional HA' : 'Zonal'})`,
        region: defaultRegion,
        count,
        currentMonthlyUsd,
        optimizedMonthlyUsd,
        savingsMonthlyUsd,
        recommendation: sku.tip,
        fileName: b.fileName,
        lineNumber: b.startLine
      });
    } else if (b.resourceType === 'google_container_cluster') {
      const currentMonthlyUsd = Number((73.0 * count).toFixed(2));
      lineItems.push({
        resourceAddress: b.address,
        resourceType: b.resourceType,
        skuDescription: 'GKE Cluster Management Fee ($0.10/hr after 1st free zonal/Autopilot cluster)',
        region: defaultRegion,
        count,
        currentMonthlyUsd,
        optimizedMonthlyUsd: Number((73.0 * count).toFixed(2)),
        savingsMonthlyUsd: 0,
        recommendation: 'Consolidate small dev clusters into namespaces with GKE Autopilot.',
        fileName: b.fileName,
        lineNumber: b.startLine
      });
    } else if (b.resourceType === 'google_compute_router_nat') {
      const currentMonthlyUsd = Number((32.85 * mult * count).toFixed(2));
      lineItems.push({
        resourceAddress: b.address,
        resourceType: b.resourceType,
        skuDescription: 'Cloud NAT Gateway Base Hourly + Data Processing',
        region: defaultRegion,
        count,
        currentMonthlyUsd,
        optimizedMonthlyUsd: Number((18.0 * mult * count).toFixed(2)),
        savingsMonthlyUsd: Number((14.85 * mult * count).toFixed(2)),
        recommendation: 'Enable Private Google Access on subnets so GCS/Artifact Registry traffic bypasses Cloud NAT data charges.',
        fileName: b.fileName,
        lineNumber: b.startLine
      });
    }
  }

  const estimatedCurrentMonthlyUsd = Number(
    lineItems.reduce((sum, item) => sum + item.currentMonthlyUsd, 0).toFixed(2)
  );
  const estimatedOptimizedMonthlyUsd = Number(
    lineItems.reduce((sum, item) => sum + item.optimizedMonthlyUsd, 0).toFixed(2)
  );
  const potentialMonthlySavingsUsd = Number(
    Math.max(0, estimatedCurrentMonthlyUsd - estimatedOptimizedMonthlyUsd).toFixed(2)
  );

  return {
    region: defaultRegion,
    estimatedCurrentMonthlyUsd,
    estimatedOptimizedMonthlyUsd,
    potentialMonthlySavingsUsd,
    annualSavingsUsd: Number((potentialMonthlySavingsUsd * 12).toFixed(2)),
    lineItems
  };
};
