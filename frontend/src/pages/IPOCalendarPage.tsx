import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, RefreshCw } from "lucide-react";
import { apiRequest } from '@/lib/api';

export default function IPOCalendarPage() {
  const [ipoData, setIpoData] = useState<any>({ upcoming: [], ongoing: [], recentlyClosed: [] });
  const [loading, setLoading] = useState(true);

  const fetchIPO = async () => {
    try {
      const data = await apiRequest('/ipo');
      setIpoData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIPO(); }, []);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="h-7 w-7 text-primary" /> IPO Calendar
          </h1>
          <p className="text-muted-foreground">Upcoming, ongoing and recent IPO listings with GMP</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchIPO}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-primary">{ipoData.upcoming?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Upcoming</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-warning">{ipoData.ongoing?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Ongoing</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-success">{ipoData.recentlyClosed?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Listed</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="text-center py-12"><RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
      ) : (
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="bg-card border border-border p-1 rounded-xl mb-4 w-full justify-start overflow-x-auto flex">
            <TabsTrigger value="upcoming" className="rounded-lg font-bold text-xs whitespace-nowrap">
              Upcoming ({ipoData.upcoming?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="ongoing" className="rounded-lg font-bold text-xs whitespace-nowrap">
              Ongoing ({ipoData.ongoing?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="closed" className="rounded-lg font-bold text-xs whitespace-nowrap">
              Recently Listed ({ipoData.recentlyClosed?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            <IPOCardList data={ipoData.upcoming || []} showGMP />
          </TabsContent>
          <TabsContent value="ongoing">
            <IPOCardList data={ipoData.ongoing || []} showGMP showSubscription />
          </TabsContent>
          <TabsContent value="closed">
            <IPOCardList data={ipoData.recentlyClosed || []} showGMP showListing />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function IPOCardList({ data, showGMP, showSubscription, showListing }: {
  data: any[]; showGMP?: boolean; showSubscription?: boolean; showListing?: boolean;
}) {
  if (!data || data.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No IPO data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((ipo: any, i: number) => {
        const gmpNum = parseInt(ipo.gmp?.replace(/[+₹,]/g, '') || '0');
        const isPositiveGMP = gmpNum > 0;

        return (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-base truncate">{ipo.companyName}</p>
                    <Badge variant="outline" className="text-[10px] shrink-0">{ipo.symbol}</Badge>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${
                      ipo.status === 'Ongoing' ? 'border-warning/30 text-warning bg-warning/10' :
                      ipo.status === 'Listed' ? 'border-success/30 text-success bg-success/10' :
                      'border-primary/30 text-primary bg-primary/10'
                    }`}>
                      {ipo.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>Price: <span className="font-semibold text-foreground">{ipo.priceBand}</span></span>
                    <span>Lot: <span className="font-semibold text-foreground">{ipo.lotSize}</span></span>
                    <span>Size: <span className="font-semibold text-foreground">{ipo.issueSize}</span></span>
                    <span>Type: <span className="font-semibold text-foreground">{ipo.type}</span></span>
                    <span>{ipo.exchange}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {showGMP && ipo.gmp && (
                    <div className="text-center min-w-15">
                      <p className="text-[10px] text-muted-foreground">GMP</p>
                      <p className={`text-sm font-bold ${isPositiveGMP ? 'text-success' : 'text-destructive'}`}>
                        {ipo.gmp}
                      </p>
                    </div>
                  )}
                  {showListing && ipo.listingGain && (
                    <div className="text-center min-w-15">
                      <p className="text-[10px] text-muted-foreground">Listed</p>
                      <p className={`text-sm font-bold ${ipo.listingGain.startsWith('+') ? 'text-success' : 'text-destructive'}`}>
                        {ipo.listingGain}
                      </p>
                    </div>
                  )}
                  {showSubscription && ipo.retail !== '-' && (
                    <div className="flex gap-2">
                      <div className="text-center min-w-10">
                        <p className="text-[10px] text-muted-foreground">QIB</p>
                        <p className="text-xs font-bold">{ipo.qib}</p>
                      </div>
                      <div className="text-center min-w-10">
                        <p className="text-[10px] text-muted-foreground">Retail</p>
                        <p className="text-xs font-bold">{ipo.retail}</p>
                      </div>
                      <div className="text-center min-w-10">
                        <p className="text-[10px] text-muted-foreground">NII</p>
                        <p className="text-xs font-bold">{ipo.nii}</p>
                      </div>
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Open</p>
                    <p className="text-xs font-semibold">{ipo.openDate}</p>
                    <p className="text-[10px] text-muted-foreground">Close</p>
                    <p className="text-xs font-semibold">{ipo.closeDate}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
