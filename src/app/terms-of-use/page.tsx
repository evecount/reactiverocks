import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function TermsOfUsePage() {
  return (
    <div className="container mx-auto py-20">
      <Card className="bg-card/80 backdrop-blur-sm neon-glow">
        <CardHeader>
          <CardTitle>Terms of Use</CardTitle>
          <CardDescription>Welcome to our application.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-muted-foreground">
            <p>By accessing or using our application, you agree to be bound by these terms of use. If you disagree with any part of the terms, then you may not access the application.</p>
            <p><strong>Accounts:</strong> When you create an account with us, you must provide us information that is accurate, complete, and current at all times. We use an anonymous `userID` to track game progress.</p>
            <p><strong>Intellectual Property:</strong> The Service and its original content, features, and functionality are and will remain the exclusive property of our company and its licensors. This project is formally attested to establish "prior art" in Reactive AI as of January 10, 2026 (SHA-256: 97f26d36e760c38217d85c88b4383a8b4b73b22f0365778a946d3e35a09e075c).</p>
            <p><strong>Termination:</strong> We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
