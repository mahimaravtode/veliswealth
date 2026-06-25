import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, DollarSign, ExternalLink } from "lucide-react";
import { apiRequest } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

export default function EmployeeDashboard() {
  const [stats, setStats] = useState({ totalClients: 12, totalAum: 45000000, activeSips: 48 });
  const [clients, setClients] = useState([
    { name: "Rahul Sharma", email: "rahul@example.com", aum: "₹24,50,000", lastActive: "2 hours ago", status: "Active" },
    { name: "Priya Patel", email: "priya@example.com", aum: "₹1,20,00,000", lastActive: "5 mins ago", status: "Active" },
    { name: "Amit Kumar", email: "amit@example.com", aum: "₹8,30,000", lastActive: "1 day ago", status: "Pending KYC" },
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Employee Console</h1>
        <p className="text-muted-foreground">Manage your assigned clients and track team AUM.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Assigned Clients" value={stats.totalClients.toString()} icon={<Users className="h-4 w-4" />} />
        <StatCard title="Total AUM Managed" value={formatCurrency(stats.totalAum)} icon={<DollarSign className="h-4 w-4" />} />
        <StatCard title="Active SIPs" value={stats.activeSips.toString()} icon={<TrendingUp className="h-4 w-4" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Roster</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Name</TableHead>
                <TableHead>Total AUM</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="font-medium">{client.name}</div>
                    <div className="text-xs text-muted-foreground">{client.email}</div>
                  </TableCell>
                  <TableCell>{client.aum}</TableCell>
                  <TableCell>{client.lastActive}</TableCell>
                  <TableCell>
                    <Badge variant={client.status === 'Active' ? 'default' : 'outline'}>
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" /> View Portfolio
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
