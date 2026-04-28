import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useOutletContext } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, ExternalLink, ShieldCheck, KeyRound, MonitorSmartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Settings() {
  const { businessId } = useOutletContext();
  
  const [kioskConfig, setKioskConfig] = useState({
    kioskTitle: 'How was your experience?',
    kioskMessage: 'Tap the microphone and speak briefly.',
    collectContact: false
  });
  const [savingKiosk, setSavingKiosk] = useState(false);

  useEffect(() => {
    if (!businessId) return;
    const fetchBiz = async () => {
      const d = await getDoc(doc(db, 'businesses', businessId));
      if (d.exists()) {
        const data = d.data();
        setKioskConfig({
          kioskTitle: data.kioskTitle || 'How was your experience?',
          kioskMessage: data.kioskMessage || 'Tap the microphone and speak briefly.',
          collectContact: data.collectContact || false
        });
      }
    };
    fetchBiz();
  }, [businessId]);

  const handleSaveKiosk = async () => {
    if (!businessId) return;
    setSavingKiosk(true);
    try {
      await updateDoc(doc(db, 'businesses', businessId), {
        kioskTitle: kioskConfig.kioskTitle,
        kioskMessage: kioskConfig.kioskMessage,
        collectContact: kioskConfig.collectContact,
        updatedAt: serverTimestamp()
      });
      // Optionally show a toast here if sonner is available
    } catch (e) {
      console.error(e);
    } finally {
      setSavingKiosk(false);
    }
  };

  
  if (!businessId) return null;

  const captureUrl = `${window.location.origin}/capture/${businessId}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(captureUrl);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">Settings</h2>
        <p className="text-muted-foreground mt-1">Configure your workspace and feedback channels.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Feedback Channel</CardTitle>
            <CardDescription>
              Share this link or QR code with your customers to start collecting feedback. 
              No login is required for them.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="p-4 bg-white rounded-xl border inline-flex">
                <QRCodeSVG value={captureUrl} size={160} level="Q" />
              </div>
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Label>Direct Link</Label>
                  <div className="flex items-center gap-2">
                    <Input readOnly value={captureUrl} className="font-mono text-sm bg-neutral-50" />
                    <Button variant="outline" size="icon" onClick={copyToClipboard} title="Copy link">
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" title="Open test link" onClick={() => window.open(captureUrl, '_blank')}>
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-4 bg-neutral-50 rounded-lg text-sm text-neutral-600">
                  <h4 className="font-semibold text-neutral-900 mb-1">How to use</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Print the QR Code for tables or receipts</li>
                    <li>Add the link to your SMS or WhatsApp receipts</li>
                    <li>Include it in your post-service emails</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kiosk Customization Card */}
        <Card className="md:col-span-2 border shadow-sm">
          <CardHeader className="bg-neutral-50/50 border-b pb-4">
            <div className="flex items-center gap-2">
               <MonitorSmartphone className="w-5 h-5 text-neutral-600" />
               <CardTitle>Kiosk Customization</CardTitle>
            </div>
            <CardDescription>
              Personalize the feedback capture screen your customers interact with.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Greeting Title</Label>
                <Input 
                  value={kioskConfig.kioskTitle} 
                  onChange={(e) => setKioskConfig(prev => ({...prev, kioskTitle: e.target.value}))}
                  placeholder="E.g. How was your experience?" 
                />
              </div>
              <div className="space-y-2">
                <Label>Instruction Subtitle</Label>
                <Input 
                  value={kioskConfig.kioskMessage} 
                  onChange={(e) => setKioskConfig(prev => ({...prev, kioskMessage: e.target.value}))}
                  placeholder="E.g. Tap the microphone and speak briefly." 
                />
              </div>
            </div>
            <div className="flex items-start md:items-center justify-between p-4 border rounded-lg bg-neutral-50 flex-col md:flex-row gap-4">
              <div className="space-y-1">
                <Label className="text-sm font-semibold">Request Customer Contact</Label>
                <p className="text-xs text-muted-foreground w-full max-w-sm">After processing the feedback, ask customers for their email or phone number for follow-ups.</p>
              </div>
              <div 
                onClick={() => setKioskConfig(prev => ({...prev, collectContact: !prev.collectContact}))}
                className={`flex-shrink-0 h-6 w-11 rounded-full relative cursor-pointer transition-colors duration-200 border ${kioskConfig.collectContact ? 'bg-foreground border-foreground' : 'bg-neutral-200 border-neutral-300'}`}
              >
                <div className={`absolute top-[2px] w-4 h-4 rounded-full bg-white transition-all duration-200 shadow-sm ${kioskConfig.collectContact ? 'left-[22px]' : 'left-[2px]'}`}></div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-neutral-50/50 flex justify-end p-4 border-t">
            <Button onClick={handleSaveKiosk} disabled={savingKiosk} size="sm">
              {savingKiosk ? 'Saving...' : 'Save Configuration'}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Access Control</CardTitle>
            <CardDescription>Manage staff roles and access.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-3 border rounded-md bg-neutral-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Administrator</p>
                  <p className="text-xs text-muted-foreground">Full workspace access</p>
                </div>
              </div>
              <Badge variant="outline">Active</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Multi-user management is available on the Pro plan.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>Configure how you receive alerts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="critical-alert" className="flex flex-col space-y-1">
                <span>Critical Alerts</span>
                <span className="font-normal text-xs text-muted-foreground">Notify on negative feedback</span>
              </Label>
              <div className="h-5 w-9 rounded-full bg-neutral-900 relative cursor-pointer">
                <div className="absolute right-1 top-1 h-3 w-3 rounded-full bg-white"></div>
              </div>
            </div>
            <div className="flex items-center justify-between opacity-50">
              <Label className="flex flex-col space-y-1">
                <span>Daily Digest</span>
                <span className="font-normal text-xs text-muted-foreground">Summary of the day's feedback</span>
              </Label>
              <div className="h-5 w-9 rounded-full bg-neutral-200 relative">
                <div className="absolute left-1 top-1 h-3 w-3 rounded-full bg-white"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
