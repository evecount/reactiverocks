import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function TermsOfUsePage() {
  return (
    <div className="container mx-auto py-20">
      <Card>
        <CardHeader>
          <CardTitle>Terms of Use</CardTitle>
          <CardDescription>Welcome to our application.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-muted-foreground">
            <p>By accessing or using our application, you agree to be bound by these terms of use. If you disagree with any part of the terms, then you may not access the application.</p>
            <p><strong>Accounts:</strong> When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>
            <p><strong>Intellectual Property:</strong> The Service and its original content, features, and functionality are and will remain the exclusive property of our company and its licensors.</p>
            <p><strong>Termination:</strong> We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
