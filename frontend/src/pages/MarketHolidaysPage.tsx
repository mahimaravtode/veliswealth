import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, RefreshCw, Clock, CheckCircle, XCircle } from "lucide-react";
import { apiRequest } from '@/lib/api';

export default function MarketHolidaysPage() {
  const [holidays, setHolidays] = useState<any>({ trading: [], clearing: [] });
  const [nextHoliday, setNextHoliday] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchHolidays = async () => {
    try {
      const [holidayData, nextData] = await Promise.all([
        apiRequest('/holidays'),
        apiRequest('/holidays/next')
      ]);
      setHolidays(holidayData);
      setNextHoliday(nextData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHolidays(); }, []);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CalendarClock className="h-7 w-7 text-primary" /> Market Holidays
          </h1>
          <p className="text-muted-foreground">NSE/BSE trading holidays calendar</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchHolidays}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {nextHoliday?.nextHoliday && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Next Market Holiday</p>
                <p className="text-lg font-bold">{nextHoliday.nextHoliday.name || nextHoliday.nextHoliday.holiday || 'N/A'}</p>
                <p className="text-xs text-muted-foreground">
                  {nextHoliday.nextHoliday.date ? new Date(nextHoliday.nextHoliday.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Date TBD'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12"><RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" /> Trading Holidays ({holidays.trading?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(!holidays.trading || holidays.trading.length === 0) ? (
                <p className="text-sm text-muted-foreground text-center py-4">No holiday data available</p>
              ) : (
                <div className="space-y-2">
                  {holidays.trading.map((h: any, i: number) => {
                    const isPast = new Date(h.date || h.holiday) < new Date();
                    return (
                      <div key={i} className={`flex items-center justify-between p-3 rounded-lg border-b last:border-0 ${isPast ? 'opacity-50' : ''}`}>
                        <div>
                          <p className="font-semibold text-sm">{h.name || h.holiday || 'Holiday'}</p>
                          <p className="text-xs text-muted-foreground">
                            {h.date || h.holiday ? new Date(h.date || h.holiday).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }) : 'TBD'}
                          </p>
                        </div>
                        <Badge variant="outline" className={`text-[10px] ${isPast ? 'bg-muted text-muted-foreground' : 'bg-success/10 text-success border-success/30'}`}>
                          {isPast ? 'Passed' : 'Upcoming'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <XCircle className="h-4 w-4 text-warning" /> Clearing Holidays ({holidays.clearing?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(!holidays.clearing || holidays.clearing.length === 0) ? (
                <p className="text-sm text-muted-foreground text-center py-4">No holiday data available</p>
              ) : (
                <div className="space-y-2">
                  {holidays.clearing.map((h: any, i: number) => {
                    const isPast = new Date(h.date || h.holiday) < new Date();
                    return (
                      <div key={i} className={`flex items-center justify-between p-3 rounded-lg border-b last:border-0 ${isPast ? 'opacity-50' : ''}`}>
                        <div>
                          <p className="font-semibold text-sm">{h.name || h.holiday || 'Holiday'}</p>
                          <p className="text-xs text-muted-foreground">
                            {h.date || h.holiday ? new Date(h.date || h.holiday).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }) : 'TBD'}
                          </p>
                        </div>
                        <Badge variant="outline" className={`text-[10px] ${isPast ? 'bg-muted text-muted-foreground' : 'bg-warning/10 text-warning border-warning/30'}`}>
                          {isPast ? 'Passed' : 'Upcoming'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
