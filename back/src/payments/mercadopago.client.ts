import { Injectable } from '@nestjs/common';
import { MercadoPagoConfig, Preference } from 'mercadopago';

@Injectable()
export class MercadoPagoClient {
  private readonly preference: Preference;

  constructor() {
    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN!,
      options: { timeout: 10000 },
    });
    this.preference = new Preference(client);
  }

  get preferenceApi() {
    return this.preference;
  }
}
