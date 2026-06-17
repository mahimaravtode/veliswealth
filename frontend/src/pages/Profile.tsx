import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Shield, Calendar, LogOut } from "lucide-react";
import { useAuthStore } from '@/store/useAuthStore';

export default function Profile() {
  const { user, logout } = useAuthStore();

  const roleColors: Record<string, string> = {
    Client: 'bg-primary/10 text-primary',
    Employee: 'bg-warning/10 text-warning',
    Admin: 'bg-destructive/10 text-destructive',
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Your account information and settings.</p>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">{user?.name?.charAt(0) || 'U'}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">{user?.name || 'User'}</h2>
              <Badge variant="outline" className={`text-xs mt-1 ${roleColors[user?.role || 'Client']}`}>{user?.role || 'Client'}</Badge>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Full Name</p>
                <p className="text-sm font-medium">{user?.name || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{user?.email || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="text-sm font-medium">{user?.role || 'Client'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Member Since</p>
                <p className="text-sm font-medium">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}</p>
              </div>
            </div>
          </div>

          <Button variant="destructive" className="w-full mt-6" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
