import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function LeaderboardPage() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
          <CardDescription>See who has the best sync with the AI.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Leaderboard coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
