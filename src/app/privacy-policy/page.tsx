import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto py-20">
      <Card>
        <CardHeader>
          <CardTitle>Privacy Policy</CardTitle>
          <CardDescription>Your privacy is important to us.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-muted-foreground">
            <p>We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and share information about you when you use our services.</p>
            <p><strong>Information We Collect:</strong> We may collect personal information you provide to us, such as your name and email address. We may also collect anonymous data regarding your gameplay to improve our AI.</p>
            <p><strong>How We Use Information:</strong> We use the information we collect to provide, maintain, and improve our services, and to personalize your experience.</p>
            <p><strong>Sharing of Information:</strong> We do not share your personal information with third parties except as described in this Privacy Policy.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
