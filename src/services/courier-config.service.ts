import { getRawSettings } from '@/services/settings.service';

export async function getCourierSettings() {
  let settings: Record<string, string> = {};
  try {
    settings = await getRawSettings('api');
  } catch (error) {
    console.error('[getCourierSettings] Failed to load stored API settings', error);
  }

  return {
    steadfastApiKey: settings.steadfast_api_key || process.env.STEADFAST_API_KEY || '',
    steadfastSecretKey:
      settings.steadfast_secret_key || process.env.STEADFAST_SECRET_KEY || '',
    pathaoClientId: settings.pathao_client_id || process.env.PATHAO_CLIENT_ID || '',
    pathaoClientSecret:
      settings.pathao_client_secret || process.env.PATHAO_CLIENT_SECRET || '',
    pathaoUsername: settings.pathao_username || process.env.PATHAO_USERNAME || '',
    pathaoPassword: settings.pathao_password || process.env.PATHAO_PASSWORD || '',
    pathaoStoreId: settings.pathao_store_id || process.env.PATHAO_STORE_ID || '',
    pathaoCityId: settings.pathao_city_id || '',
    pathaoZoneId: settings.pathao_zone_id || '',
    pathaoDeliveryType: settings.pathao_delivery_type || '48',
    pathaoItemWeight: settings.pathao_item_weight || '0.5',
    redxAccessToken:
      settings.redx_access_token ||
      settings.redx_api_key ||
      process.env.REDX_ACCESS_TOKEN ||
      process.env.REDX_API_KEY ||
      '',
    redxStoreId: settings.redx_store_id || process.env.REDX_STORE_ID || '0',
  };
}
