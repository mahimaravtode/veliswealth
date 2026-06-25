import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Plus, Calendar, AlertCircle } from "lucide-react";
import { apiRequest } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

export default function Insurance() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const data = await apiRequest('/insurance');
      setPolicies(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMock = async () => {
    try {
      await apiRequest('/insurance', {
        method: 'POST',
        body: JSON.stringify({
          policyName: "Family Health Optima",
          type: "Health",
          provider: "Star Health",
          premiumAmount: 18500,
          sumAssured: 1000000,
          expiryDate: "2027-05-20"
        }),
      });
      fetchPolicies();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Insurance Portfolio</h1>
          <p className="text-muted-foreground">Manage your life, health, and general insurance policies.</p>
        </div>
        <Button onClick={handleAddMock}>
          <Plus className="mr-2 h-4 w-4" /> Add Policy
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Total Sum Assured</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(policies.reduce((acc, p) => acc + (p.sumAssured || 0), 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Active Policies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{policies.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Next Premium Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" /> June 12
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Policies</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Policy Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Sum Assured</TableHead>
                <TableHead>Premium</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No insurance policies added yet.
                  </TableCell>
                </TableRow>
              ) : (
                policies.map((p, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{p.policyName}</TableCell>
                    <TableCell><Badge variant="outline">{p.type}</Badge></TableCell>
                    <TableCell>{p.provider}</TableCell>
                    <TableCell>{formatCurrency(p.sumAssured)}</TableCell>
                    <TableCell>{formatCurrency(p.premiumAmount)}</TableCell>
                    <TableCell><Badge className="bg-success/10 text-success hover:bg-success/20 border-none">{p.status}</Badge></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
