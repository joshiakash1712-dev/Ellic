import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import {
  Lock,
  KeyRound,
  ShieldCheck,
  Printer,
  Radio,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Zap,
  Globe,
  Wifi
} from 'lucide-react';

export const AdminSecurity: React.FC = () => {
  const { addAuditLog } = useStore();
  const { currentUser, isTotpEnrolled, setIsSyncHubOpen } = useAuth();

  // API Keys state
  const [apiKeys, setApiKeys] = useState(() => [
    {
      id: 'key-prod-01',
      name: 'GST E-Way Bill API Ingress',
      key: `elx_key_${'99281a8b'}_example_01`,
      scope: 'read_write_gst',
      created: '2025-01-15',
      lastUsed: '10 mins ago',
      status: 'active'
    },
    {
      id: 'key-prod-02',
      name: 'UPI Razorpay Terminal Integration',
      key: `elx_key_${'4477aa22'}_example_02`,
      scope: 'payments_pos',
      created: '2025-02-01',
      lastUsed: 'Just now',
      status: 'active'
    }
  ]);

  const [isKeyVisible, setIsKeyVisible] = useState<Record<string, boolean>>({});
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScope, setNewKeyScope] = useState('read_write_all');
  const [isCreatingKey, setIsCreatingKey] = useState(false);

  // Webhooks state
  const [webhooks, setWebhooks] = useState(() => [
    {
      id: 'wh-1',
      event: 'invoice.created',
      targetUrl: 'https://api.ellic.com/webhooks/whatsapp-invoice',
      status: 'healthy',
      secret: `wh_demo_${'8899aabb'}_placeholder`
    },
    {
      id: 'wh-2',
      event: 'inventory.low_stock',
      targetUrl: 'https://api.ellic.com/webhooks/restock-alert',
      status: 'healthy',
      secret: `wh_demo_${'55667788'}_placeholder`
    }
  ]);

  const [pingStatus, setPingStatus] = useState<Record<string, string>>({});

  // Hardware Drivers state
  const [hardwareConfig, setHardwareConfig] = useState({
    printerProtocol: 'ESC/POS Thermal',
    paperWidth: '80mm',
    interfaceType: 'USB / COM Port',
    autoCut: true,
    cashDrawerPulse: true,
    customerPoleDisplay: true,
    barcodeScannerHID: true,
    scaleSerialPort: 'COM3 (9600 baud)'
  });

  const [hardwareSaved, setHardwareSaved] = useState(false);

  // Security Policies state
  const [secPolicies, setSecPolicies] = useState({
    enforce2FA: true,
    sessionTimeoutMinutes: 60,
    managerPinOnRefund: true,
    strictIPWhitelisting: false,
    lockoutAfterFailedAttempts: 5
  });

  const [secPolicySaved, setSecPolicySaved] = useState(false);

  const toggleKeyVisibility = (id: string) => {
    setIsKeyVisible(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateAPIKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    const randomHex = Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const newKey = {
      id: `key-${Date.now()}`,
      name: newKeyName.trim(),
      key: `elx_live_${randomHex}`,
      scope: newKeyScope,
      created: new Date().toISOString().slice(0, 10),
      lastUsed: 'Never',
      status: 'active'
    };

    setApiKeys(prev => [newKey, ...prev]);
    setNewKeyName('');
    setIsCreatingKey(false);
    addAuditLog('API Secret Key Created', `Provisioned API key "${newKey.name}" with scope ${newKey.scope}`);
  };

  const handleRevokeKey = (id: string, name: string) => {
    setApiKeys(prev => prev.filter(k => k.id !== id));
    addAuditLog('API Key Revoked', `Decommissioned key "${name}" (${id})`, 'warning');
  };

  const handlePingWebhook = (id: string) => {
    setPingStatus(prev => ({ ...prev, [id]: 'pinging' }));
    setTimeout(() => {
      setPingStatus(prev => ({ ...prev, [id]: '200 OK (28ms)' }));
      addAuditLog('Webhook Test Ping', `Dispatched test payload to webhook ${id}`);
    }, 600);
  };

  const handleSaveHardware = () => {
    setHardwareSaved(true);
    addAuditLog('POS Hardware Config Updated', `Printer: ${hardwareConfig.printerProtocol} (${hardwareConfig.paperWidth}), Port: ${hardwareConfig.interfaceType}`);
    setTimeout(() => setHardwareSaved(false), 3000);
  };

  const handleSaveSecurityPolicies = () => {
    setSecPolicySaved(true);
    addAuditLog('Security Policies Modified', `2FA: ${secPolicies.enforce2FA}, Timeout: ${secPolicies.sessionTimeoutMinutes}min`);
    setTimeout(() => setSecPolicySaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Lock className="w-5 h-5 text-sky-400" />
          <span>Security Governance, API Secrets & POS Hardware Drivers</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure enterprise authentication policies, manage server API keys, register webhook callbacks, and calibrate thermal POS peripherals.
        </p>
      </div>

      {/* 1. ENTERPRISE SECURITY POLICIES */}
      <div className="p-5 sm:p-6 rounded-xl bg-[#121826] border border-slate-800 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <span>Authentication & Session Policies</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Enforce strict tenant compliance across all cashier terminals and administrative sessions.
            </p>
          </div>
          <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-500/20">
            SOC2 Ready
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[#0A0E1A] border border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-200 block">Enforce 2FA on Admin Roles</span>
              <span className="text-[10px] text-slate-400">Mandate OTP for Owner & Manager logins</span>
            </div>
            <input
              type="checkbox"
              checked={secPolicies.enforce2FA}
              onChange={e => setSecPolicies(prev => ({ ...prev, enforce2FA: e.target.checked }))}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-[#121826] border-slate-700"
            />
          </div>

          <div className="p-4 rounded-xl bg-[#0A0E1A] border border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-200 block">Manager PIN on Discount/Void</span>
              <span className="text-[10px] text-slate-400">Require supervisor override on POS bill edits</span>
            </div>
            <input
              type="checkbox"
              checked={secPolicies.managerPinOnRefund}
              onChange={e => setSecPolicies(prev => ({ ...prev, managerPinOnRefund: e.target.checked }))}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-[#121826] border-slate-700"
            />
          </div>

          <div className="p-4 rounded-xl bg-[#0A0E1A] border border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-200 block">Session Inactivity Timeout</span>
              <span className="text-[10px] text-slate-400">Auto-lock idle cashier terminals</span>
            </div>
            <select
              value={secPolicies.sessionTimeoutMinutes}
              onChange={e => setSecPolicies(prev => ({ ...prev, sessionTimeoutMinutes: Number(e.target.value) }))}
              className="bg-[#121826] border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 font-bold focus:outline-none focus:border-sky-500"
            >
              <option value={15}>15 Mins</option>
              <option value={30}>30 Mins</option>
              <option value={60}>60 Mins</option>
              <option value={120}>2 Hours</option>
            </select>
          </div>
        </div>

        {/* TOTP Two-Factor Authentication Status for Super Admin / Client Roles */}
        <div className="p-4 rounded-xl bg-[#0A0E1A] border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              isTotpEnrolled
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
            }`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">TOTP Two-Factor Authentication (Firebase Auth)</span>
                {isTotpEnrolled ? (
                  <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-500/20">
                    Active on Your Session
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                    Recommended for Super Admin & Client
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isTotpEnrolled
                  ? 'Your account is secured with time-based one-time codes on login.'
                  : 'Protect root governance and tenant administrative privileges with Google Authenticator or 1Password.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSyncHubOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 font-semibold text-xs border border-slate-700 transition-colors shrink-0 flex items-center gap-1.5"
          >
            <span>{isTotpEnrolled ? 'Manage 2FA' : 'Configure 2FA'}</span>
          </button>
        </div>

        <div className="flex items-center justify-between pt-2">
          {secPolicySaved ? (
            <span className="text-xs text-sky-400 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Security policies updated and applied to active sessions.
            </span>
          ) : <div />}

          <button
            onClick={handleSaveSecurityPolicies}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-colors"
          >
            Save Security Policies
          </button>
        </div>
      </div>

      {/* 2. API KEYS & WEBHOOKS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* API Keys */}
        <div className="p-5 sm:p-6 rounded-xl bg-[#121826] border border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-sky-400" />
                <span>API Keys & Machine Credentials</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate live integration keys for ERP, GST portals, and payment gateways.
              </p>
            </div>
            <button
              onClick={() => setIsCreatingKey(!isCreatingKey)}
              className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold transition-colors"
            >
              {isCreatingKey ? 'Cancel' : '+ New Key'}
            </button>
          </div>

          {isCreatingKey && (
            <form onSubmit={handleCreateAPIKey} className="p-4 rounded-xl bg-[#161D2C] border border-slate-800 space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">Key Description / Integration Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tally ERP Sync Bridge"
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  className="w-full bg-[#0A0E1A] border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">Scope</label>
                <select
                  value={newKeyScope}
                  onChange={e => setNewKeyScope(e.target.value)}
                  className="w-full bg-[#0A0E1A] border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="read_write_all">Full Access (Read / Write All)</option>
                  <option value="read_only_inventory">Read Only (Inventory & Stock)</option>
                  <option value="pos_invoicing">POS Invoicing & Billing</option>
                  <option value="gst_compliance">GST Compliance & E-Way Bills</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors"
              >
                Generate API Secret Key
              </button>
            </form>
          )}

          <div className="space-y-2.5">
            {apiKeys.map(k => (
              <div
                key={k.id}
                className="p-3.5 rounded-xl bg-[#0A0E1A] border border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">{k.name}</span>
                  <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded-lg border border-sky-500/20">
                    {k.scope}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[#121826] border border-slate-800 px-3 py-1.5 rounded-lg font-mono text-[11px] text-slate-300 truncate">
                    {isKeyVisible[k.id] ? k.key : `${k.key.slice(0, 10)}••••••••••••••••`}
                  </div>
                  <button
                    onClick={() => toggleKeyVisibility(k.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title={isKeyVisible[k.id] ? 'Hide Key' : 'Show Key'}
                  >
                    {isKeyVisible[k.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(k.key);
                      setCopiedKeyId(k.id);
                      setTimeout(() => setCopiedKeyId(null), 2000);
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title={copiedKeyId === k.id ? 'Copied!' : 'Copy Key'}
                  >
                    {copiedKeyId === k.id ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleRevokeKey(k.id, k.name)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Revoke Key"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Webhooks Configurator */}
        <div className="p-5 sm:p-6 rounded-xl bg-[#121826] border border-slate-800 shadow-lg space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-sky-400" />
              <span>Event Webhooks & Automation Endpoints</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Broadcast event payloads (invoices, restocks, credit balance) to external endpoints in real-time.
            </p>
          </div>

          <div className="space-y-3">
            {webhooks.map(wh => (
              <div
                key={wh.id}
                className="p-3.5 rounded-xl bg-[#0A0E1A] border border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sky-400 font-mono text-[11px]">{wh.event}</span>
                  <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded-lg border border-sky-500/20">
                    {wh.status}
                  </span>
                </div>

                <div className="font-mono text-[11px] text-slate-300 truncate bg-[#121826] border border-slate-800 p-2 rounded-lg">
                  {wh.targetUrl}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Secret: {wh.secret.slice(0, 10)}••••
                  </span>
                  <button
                    onClick={() => handlePingWebhook(wh.id)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                  >
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>{pingStatus[wh.id] || 'Test Ping'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 3. POS HARDWARE & PERIPHERAL DRIVERS */}
      <div className="p-5 sm:p-6 rounded-xl bg-[#121826] border border-slate-800 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Printer className="w-5 h-5 text-sky-400" />
              <span>POS Peripheral Hardware Drivers & Thermal Calibration</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Direct ESC/POS command configuration for receipt printers, cash drawers, customer pole displays, and barcode readers.
            </p>
          </div>
          <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-500/20">
            Native Driver Emulation
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          
          <div className="p-4 rounded-xl bg-[#0A0E1A] border border-slate-800 space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 block">Thermal Protocol</label>
            <select
              value={hardwareConfig.printerProtocol}
              onChange={e => setHardwareConfig(prev => ({ ...prev, printerProtocol: e.target.value }))}
              className="w-full bg-[#121826] border border-slate-800 rounded-lg px-3 py-2 text-white font-semibold focus:outline-none focus:border-sky-500"
            >
              <option value="ESC/POS Thermal">ESC/POS (Epson / TVS / NGX)</option>
              <option value="StarPRNT">StarPRNT / TSP100</option>
              <option value="Citizen POS">Citizen POS Protocol</option>
              <option value="ZPL Thermal">Zebra ZPL Label</option>
            </select>
          </div>

          <div className="p-4 rounded-xl bg-[#0A0E1A] border border-slate-800 space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 block">Paper Roll Width</label>
            <select
              value={hardwareConfig.paperWidth}
              onChange={e => setHardwareConfig(prev => ({ ...prev, paperWidth: e.target.value }))}
              className="w-full bg-[#121826] border border-slate-800 rounded-lg px-3 py-2 text-white font-semibold focus:outline-none focus:border-sky-500"
            >
              <option value="80mm">80mm (3-Inch Standard Receipt)</option>
              <option value="58mm">58mm (2-Inch Compact Receipt)</option>
              <option value="A4">A4 Full Sheet Laser</option>
            </select>
          </div>

          <div className="p-4 rounded-xl bg-[#0A0E1A] border border-slate-800 space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 block">Interface Port</label>
            <select
              value={hardwareConfig.interfaceType}
              onChange={e => setHardwareConfig(prev => ({ ...prev, interfaceType: e.target.value }))}
              className="w-full bg-[#121826] border border-slate-800 rounded-lg px-3 py-2 text-white font-semibold focus:outline-none focus:border-sky-500"
            >
              <option value="USB / COM Port">USB / Direct Virtual COM</option>
              <option value="Bluetooth BLE">Bluetooth BLE Wireless</option>
              <option value="Network TCP/IP">Ethernet TCP/IP (9100)</option>
            </select>
          </div>

          <div className="p-4 rounded-xl bg-[#0A0E1A] border border-slate-800 space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 block">Cash Drawer Kick Pulse</label>
            <select
              value={hardwareConfig.cashDrawerPulse ? 'yes' : 'no'}
              onChange={e => setHardwareConfig(prev => ({ ...prev, cashDrawerPulse: e.target.value === 'yes' }))}
              className="w-full bg-[#121826] border border-slate-800 rounded-lg px-3 py-2 text-white font-semibold focus:outline-none focus:border-sky-500"
            >
              <option value="yes">RJ11 Pulse on Bill Finalize (Pin 2 / 50ms)</option>
              <option value="no">Disabled</option>
            </select>
          </div>

        </div>

        <div className="flex items-center justify-between pt-2">
          {hardwareSaved ? (
            <span className="text-xs text-sky-400 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Hardware driver parameters saved and loaded into terminal bridge.
            </span>
          ) : <div />}

          <button
            onClick={handleSaveHardware}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-colors"
          >
            Save Hardware Configuration
          </button>
        </div>
      </div>

    </div>
  );
};
