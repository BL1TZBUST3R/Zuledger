import { Component, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SettingsService, LedgerSettings } from '../../services/settings.service';
import { CurrencyService, Currency, REFRESH_OPTIONS, RefreshIntervalMs } from '../../services/currency.service';
import { MfaService, MfaStatus, TrustedDevice } from '../../services/mfa.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
})
export class SettingsComponent implements OnInit {

  ledgerId: string | null = null;
  isLoading = false;
  isSaving = false;
  successMessage = '';
  errorMessage = '';

  settings: LedgerSettings = {
    fiscal_year_end_month: 12,
    timezone: 'UTC',
    date_format: 'DD/MM/YYYY',
    lock_date: null,
    currency: 'USD',
  };

  // Currency converter widget state
  currencies: Currency[] = [];
  converterAmount = 100;
  converterFrom = 'USD';
  converterTo = 'EUR';
  converterResult: number | null = null;

  // Live FX refresh-frequency options (exposed to template)
  refreshOptions = REFRESH_OPTIONS;

  // ── MFA state ─────────────────────────────────────────────────────
  mfaEnabled = false;
  mfaTrustedDevices: TrustedDevice[] = [];
  mfaLoading = false;
  mfaStage: 'idle' | 'awaiting-code' | 'disable-prompt' = 'idle';
  mfaCode = '';
  mfaPassword = '';
  mfaMessage = '';
  mfaError = '';

  months = [
    { value: 1,  label: 'January' },
    { value: 2,  label: 'February' },
    { value: 3,  label: 'March' },
    { value: 4,  label: 'April' },
    { value: 5,  label: 'May' },
    { value: 6,  label: 'June' },
    { value: 7,  label: 'July' },
    { value: 8,  label: 'August' },
    { value: 9,  label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  // Full IANA timezone list grouped by region
  timezones = [
    { group: 'Africa', zones: ['Africa/Abidjan','Africa/Accra','Africa/Addis_Ababa','Africa/Algiers','Africa/Asmara','Africa/Bamako','Africa/Bangui','Africa/Banjul','Africa/Bissau','Africa/Blantyre','Africa/Brazzaville','Africa/Bujumbura','Africa/Cairo','Africa/Casablanca','Africa/Ceuta','Africa/Conakry','Africa/Dakar','Africa/Dar_es_Salaam','Africa/Djibouti','Africa/Douala','Africa/El_Aaiun','Africa/Freetown','Africa/Gaborone','Africa/Harare','Africa/Johannesburg','Africa/Juba','Africa/Kampala','Africa/Khartoum','Africa/Kigali','Africa/Kinshasa','Africa/Lagos','Africa/Libreville','Africa/Lome','Africa/Luanda','Africa/Lubumbashi','Africa/Lusaka','Africa/Malabo','Africa/Maputo','Africa/Maseru','Africa/Mbabane','Africa/Mogadishu','Africa/Monrovia','Africa/Nairobi','Africa/Ndjamena','Africa/Niamey','Africa/Nouakchott','Africa/Ouagadougou','Africa/Porto-Novo','Africa/Sao_Tome','Africa/Tripoli','Africa/Tunis','Africa/Windhoek'] },
    { group: 'America', zones: ['America/Adak','America/Anchorage','America/Anguilla','America/Antigua','America/Araguaina','America/Argentina/Buenos_Aires','America/Argentina/Catamarca','America/Argentina/Cordoba','America/Argentina/Jujuy','America/Argentina/La_Rioja','America/Argentina/Mendoza','America/Argentina/Rio_Gallegos','America/Argentina/Salta','America/Argentina/San_Juan','America/Argentina/San_Luis','America/Argentina/Tucuman','America/Argentina/Ushuaia','America/Aruba','America/Asuncion','America/Atikokan','America/Bahia','America/Bahia_Banderas','America/Barbados','America/Belem','America/Belize','America/Blanc-Sablon','America/Boa_Vista','America/Bogota','America/Boise','America/Cambridge_Bay','America/Campo_Grande','America/Cancun','America/Caracas','America/Cayenne','America/Cayman','America/Chicago','America/Chihuahua','America/Costa_Rica','America/Creston','America/Cuiaba','America/Curacao','America/Danmarkshavn','America/Dawson','America/Dawson_Creek','America/Denver','America/Detroit','America/Dominica','America/Edmonton','America/Eirunepe','America/El_Salvador','America/Fortaleza','America/Glace_Bay','America/Godthab','America/Goose_Bay','America/Grand_Turk','America/Grenada','America/Guadeloupe','America/Guatemala','America/Guayaquil','America/Guyana','America/Halifax','America/Havana','America/Hermosillo','America/Indiana/Indianapolis','America/Indiana/Knox','America/Indiana/Marengo','America/Indiana/Petersburg','America/Indiana/Tell_City','America/Indiana/Vevay','America/Indiana/Vincennes','America/Indiana/Winamac','America/Inuvik','America/Iqaluit','America/Jamaica','America/Juneau','America/Kentucky/Louisville','America/Kentucky/Monticello','America/Kralendijk','America/La_Paz','America/Lima','America/Los_Angeles','America/Lower_Princes','America/Maceio','America/Managua','America/Manaus','America/Marigot','America/Martinique','America/Matamoros','America/Mazatlan','America/Menominee','America/Merida','America/Metlakatla','America/Mexico_City','America/Miquelon','America/Moncton','America/Monterrey','America/Montevideo','America/Montserrat','America/Nassau','America/New_York','America/Nipigon','America/Nome','America/Noronha','America/North_Dakota/Beulah','America/North_Dakota/Center','America/North_Dakota/New_Salem','America/Ojinaga','America/Panama','America/Pangnirtung','America/Paramaribo','America/Phoenix','America/Port-au-Prince','America/Port_of_Spain','America/Porto_Velho','America/Puerto_Rico','America/Punta_Arenas','America/Rainy_River','America/Rankin_Inlet','America/Recife','America/Regina','America/Resolute','America/Rio_Branco','America/Santarem','America/Santiago','America/Santo_Domingo','America/Sao_Paulo','America/Scoresbysund','America/Sitka','America/St_Barthelemy','America/St_Johns','America/St_Kitts','America/St_Lucia','America/St_Thomas','America/St_Vincent','America/Swift_Current','America/Tegucigalpa','America/Thule','America/Thunder_Bay','America/Tijuana','America/Toronto','America/Tortola','America/Vancouver','America/Whitehorse','America/Winnipeg','America/Yakutat','America/Yellowknife'] },
    { group: 'Antarctica', zones: ['Antarctica/Casey','Antarctica/Davis','Antarctica/DumontDUrville','Antarctica/Macquarie','Antarctica/Mawson','Antarctica/McMurdo','Antarctica/Palmer','Antarctica/Rothera','Antarctica/Syowa','Antarctica/Troll','Antarctica/Vostok'] },
    { group: 'Arctic', zones: ['Arctic/Longyearbyen'] },
    { group: 'Asia', zones: ['Asia/Aden','Asia/Almaty','Asia/Amman','Asia/Anadyr','Asia/Aqtau','Asia/Aqtobe','Asia/Ashgabat','Asia/Atyrau','Asia/Baghdad','Asia/Bahrain','Asia/Baku','Asia/Bangkok','Asia/Barnaul','Asia/Beirut','Asia/Bishkek','Asia/Brunei','Asia/Chita','Asia/Choibalsan','Asia/Colombo','Asia/Damascus','Asia/Dhaka','Asia/Dili','Asia/Dubai','Asia/Dushanbe','Asia/Famagusta','Asia/Gaza','Asia/Hebron','Asia/Ho_Chi_Minh','Asia/Hong_Kong','Asia/Hovd','Asia/Irkutsk','Asia/Jakarta','Asia/Jayapura','Asia/Jerusalem','Asia/Kabul','Asia/Kamchatka','Asia/Karachi','Asia/Kathmandu','Asia/Khandyga','Asia/Kolkata','Asia/Krasnoyarsk','Asia/Kuala_Lumpur','Asia/Kuching','Asia/Kuwait','Asia/Macau','Asia/Magadan','Asia/Makassar','Asia/Manila','Asia/Muscat','Asia/Nicosia','Asia/Novokuznetsk','Asia/Novosibirsk','Asia/Omsk','Asia/Oral','Asia/Phnom_Penh','Asia/Pontianak','Asia/Pyongyang','Asia/Qatar','Asia/Qostanay','Asia/Qyzylorda','Asia/Riyadh','Asia/Sakhalin','Asia/Samarkand','Asia/Seoul','Asia/Shanghai','Asia/Singapore','Asia/Srednekolymsk','Asia/Taipei','Asia/Tashkent','Asia/Tbilisi','Asia/Tehran','Asia/Thimphu','Asia/Tokyo','Asia/Tomsk','Asia/Ulaanbaatar','Asia/Urumqi','Asia/Ust-Nera','Asia/Vientiane','Asia/Vladivostok','Asia/Yakutsk','Asia/Yangon','Asia/Yekaterinburg','Asia/Yerevan'] },
    { group: 'Atlantic', zones: ['Atlantic/Azores','Atlantic/Bermuda','Atlantic/Canary','Atlantic/Cape_Verde','Atlantic/Faroe','Atlantic/Madeira','Atlantic/Reykjavik','Atlantic/South_Georgia','Atlantic/St_Helena','Atlantic/Stanley'] },
    { group: 'Australia', zones: ['Australia/Adelaide','Australia/Brisbane','Australia/Broken_Hill','Australia/Darwin','Australia/Eucla','Australia/Hobart','Australia/Lindeman','Australia/Lord_Howe','Australia/Melbourne','Australia/Perth','Australia/Sydney'] },
    { group: 'Europe', zones: ['Europe/Amsterdam','Europe/Andorra','Europe/Astrakhan','Europe/Athens','Europe/Belgrade','Europe/Berlin','Europe/Bratislava','Europe/Brussels','Europe/Bucharest','Europe/Budapest','Europe/Busingen','Europe/Chisinau','Europe/Copenhagen','Europe/Dublin','Europe/Gibraltar','Europe/Guernsey','Europe/Helsinki','Europe/Isle_of_Man','Europe/Istanbul','Europe/Jersey','Europe/Kaliningrad','Europe/Kiev','Europe/Kirov','Europe/Lisbon','Europe/Ljubljana','Europe/London','Europe/Luxembourg','Europe/Madrid','Europe/Malta','Europe/Mariehamn','Europe/Minsk','Europe/Monaco','Europe/Moscow','Europe/Nicosia','Europe/Oslo','Europe/Paris','Europe/Podgorica','Europe/Prague','Europe/Riga','Europe/Rome','Europe/Samara','Europe/San_Marino','Europe/Sarajevo','Europe/Saratov','Europe/Simferopol','Europe/Skopje','Europe/Sofia','Europe/Stockholm','Europe/Tallinn','Europe/Tirane','Europe/Ulyanovsk','Europe/Uzhgorod','Europe/Vaduz','Europe/Vatican','Europe/Vienna','Europe/Vilnius','Europe/Volgograd','Europe/Warsaw','Europe/Zagreb','Europe/Zaporozhye','Europe/Zurich'] },
    { group: 'Indian', zones: ['Indian/Antananarivo','Indian/Chagos','Indian/Christmas','Indian/Cocos','Indian/Comoro','Indian/Kerguelen','Indian/Mahe','Indian/Maldives','Indian/Mauritius','Indian/Mayotte','Indian/Reunion'] },
    { group: 'Pacific', zones: ['Pacific/Apia','Pacific/Auckland','Pacific/Bougainville','Pacific/Chatham','Pacific/Chuuk','Pacific/Easter','Pacific/Efate','Pacific/Enderbury','Pacific/Fakaofo','Pacific/Fiji','Pacific/Funafuti','Pacific/Galapagos','Pacific/Gambier','Pacific/Guadalcanal','Pacific/Guam','Pacific/Honolulu','Pacific/Kiritimati','Pacific/Kosrae','Pacific/Kwajalein','Pacific/Majuro','Pacific/Marquesas','Pacific/Midway','Pacific/Nauru','Pacific/Niue','Pacific/Norfolk','Pacific/Noumea','Pacific/Pago_Pago','Pacific/Palau','Pacific/Pitcairn','Pacific/Pohnpei','Pacific/Port_Moresby','Pacific/Rarotonga','Pacific/Saipan','Pacific/Tahiti','Pacific/Tarawa','Pacific/Tongatapu','Pacific/Wake','Pacific/Wallis'] },
    { group: 'UTC', zones: ['UTC'] },
  ];

  constructor(
    private route: ActivatedRoute,
    private settingsService: SettingsService,
    public currencyService: CurrencyService,
    private mfaService: MfaService
  ) {
    // Re-run conversion whenever live rates update (auto-refresh tick or manual refresh).
    effect(() => {
      this.currencyService.liveRates();
      this.runConverter();
    });
  }

  ngOnInit() {
    this.currencies = this.currencyService.currencies;
    this.ledgerId = this.route.snapshot.paramMap.get('id');
    if (this.ledgerId) {
      this.loadSettings();
    }
    this.runConverter();
    this.loadMfaStatus();
  }

  // ── MFA ────────────────────────────────────────────────────────────
  loadMfaStatus() {
    this.mfaService.status().subscribe({
      next: (s: MfaStatus) => {
        this.mfaEnabled = s.mfa_enabled;
        this.mfaTrustedDevices = s.trusted_devices;
      },
      error: () => { /* not fatal — settings page still works */ }
    });
  }

  startEnableMfa() {
    this.mfaError = '';
    this.mfaMessage = '';
    this.mfaLoading = true;
    this.mfaService.enable().subscribe({
      next: (r) => {
        this.mfaMessage = r.message;
        this.mfaStage = 'awaiting-code';
        this.mfaLoading = false;
      },
      error: (err) => {
        this.mfaError = err?.error?.message || 'Failed to start MFA setup.';
        this.mfaLoading = false;
      }
    });
  }

  confirmEnableMfa() {
    if (this.mfaCode.length !== 6 || this.mfaLoading) return;
    this.mfaError = '';
    this.mfaLoading = true;
    this.mfaService.confirmEnable(this.mfaCode).subscribe({
      next: () => {
        this.mfaCode = '';
        this.mfaStage = 'idle';
        this.mfaMessage = 'Two-factor authentication is now enabled.';
        this.mfaLoading = false;
        this.loadMfaStatus();
      },
      error: (err) => {
        this.mfaError = err?.error?.message || 'Invalid or expired code.';
        this.mfaLoading = false;
      }
    });
  }

  startDisableMfa() {
    this.mfaError = '';
    this.mfaMessage = '';
    this.mfaPassword = '';
    this.mfaStage = 'disable-prompt';
  }

  confirmDisableMfa() {
    if (!this.mfaPassword || this.mfaLoading) return;
    this.mfaError = '';
    this.mfaLoading = true;
    this.mfaService.disable(this.mfaPassword).subscribe({
      next: () => {
        this.mfaPassword = '';
        this.mfaStage = 'idle';
        this.mfaMessage = 'Two-factor authentication disabled.';
        this.mfaLoading = false;
        this.mfaService.clearTrustToken();
        this.loadMfaStatus();
      },
      error: (err) => {
        this.mfaError = err?.error?.message || 'Failed to disable MFA.';
        this.mfaLoading = false;
      }
    });
  }

  cancelMfaPrompt() {
    this.mfaCode = '';
    this.mfaPassword = '';
    this.mfaStage = 'idle';
    this.mfaError = '';
  }

  revokeTrustedDevice(id: number) {
    this.mfaService.revokeDevice(id).subscribe({
      next: () => this.loadMfaStatus(),
      error: (err) => {
        this.mfaError = err?.error?.message || 'Failed to revoke device.';
      }
    });
  }

  onMfaCodeInput(value: string) {
    this.mfaCode = value.replace(/\D/g, '').slice(0, 6);
  }

  formatDevice(d: TrustedDevice): string {
    if (!d.user_agent) return 'Unknown device';
    const ua = d.user_agent;
    const browser = /Firefox/.test(ua) ? 'Firefox'
                  : /Edg/.test(ua) ? 'Edge'
                  : /Chrome/.test(ua) ? 'Chrome'
                  : /Safari/.test(ua) ? 'Safari'
                  : 'Browser';
    const os = /Windows/.test(ua) ? 'Windows'
             : /Mac OS X|Macintosh/.test(ua) ? 'macOS'
             : /Android/.test(ua) ? 'Android'
             : /iPhone|iPad|iOS/.test(ua) ? 'iOS'
             : /Linux/.test(ua) ? 'Linux'
             : 'Unknown';
    return `${browser} on ${os}`;
  }

  loadSettings() {
    this.isLoading = true;
    this.settingsService.getSettings(this.ledgerId!).subscribe({
      next: (data) => {
        this.settings = { ...data, currency: (data.currency || 'USD').toUpperCase() };
        this.currencyService.setActive(this.settings.currency);
        this.converterFrom = this.settings.currency;
        this.runConverter();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load settings.';
        this.isLoading = false;
      }
    });
  }

  save() {
    if (!this.ledgerId) return;
    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.settingsService.saveSettings(this.ledgerId, this.settings).subscribe({
      next: () => {
        this.successMessage = 'Settings saved successfully.';
        this.currencyService.setActive(this.settings.currency);
        this.isSaving = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to save settings.';
        this.isSaving = false;
      }
    });
  }

  clearLockDate() {
    this.settings.lock_date = null;
  }

  runConverter() {
    const amt = Number(this.converterAmount);
    if (!amt || isNaN(amt)) {
      this.converterResult = null;
      return;
    }
    const result = this.currencyService.convert(amt, this.converterFrom, this.converterTo);
    this.converterResult = isNaN(result) ? null : result;
  }

  swapConverter() {
    const tmp = this.converterFrom;
    this.converterFrom = this.converterTo;
    this.converterTo = tmp;
    this.runConverter();
  }

  formatMoney(amount: number, code: string): string {
    return this.currencyService.format(amount, code);
  }

  refreshRates() {
    this.currencyService.fetchRates(true);
  }

  onRefreshIntervalChange(value: string | number) {
    const ms = Number(value) as RefreshIntervalMs;
    this.currencyService.setRefreshInterval(ms);
  }

  formatUpdatedAt(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  }
}
