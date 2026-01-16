
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  const { key } = req.query;
  const adminKey = process.env.ADMIN_KEY;

  if (!key || key !== adminKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const now = new Date().toISOString();
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayIso = today.toISOString();
    
    const last7 = new Date();
    last7.setDate(last7.getDate() - 7);
    const last7Iso = last7.toISOString();

    const last30 = new Date();
    last30.setDate(last30.getDate() - 30);
    const last30Iso = last30.toISOString();

    // Stats
    const { count: countToday } = await supabase.from('events').select('*', { count: 'exact', head: true }).eq('event_name', 'page_view').gte('created_at', todayIso);
    const { count: count7 } = await supabase.from('events').select('*', { count: 'exact', head: true }).eq('event_name', 'page_view').gte('created_at', last7Iso);
    const { count: count30 } = await supabase.from('events').select('*', { count: 'exact', head: true }).eq('event_name', 'page_view').gte('created_at', last30Iso);
    
    const { data: uniqueData } = await supabase.rpc('get_unique_visitors_count'); // Fallback if RPC exists or handle manually
    // Manually if no RPC:
    const { data: visitors } = await supabase.from('events').select('visitor_id');
    const uniqueVisitors = new Set(visitors?.map(v => v.visitor_id)).size;

    // Top Events
    const { data: topEventsData } = await supabase.from('events').select('event_name');
    const eventCounts: any = {};
    topEventsData?.forEach(e => eventCounts[e.event_name] = (eventCounts[e.event_name] || 0) + 1);
    const topEvents = Object.entries(eventCounts).map(([event_name, count]) => ({ event_name, count: count as number })).sort((a,b) => b.count - a.count).slice(0, 10);

    // Top Pages
    const { data: topPagesData } = await supabase.from('events').select('path');
    const pathCounts: any = {};
    topPagesData?.forEach(e => pathCounts[e.path] = (pathCounts[e.path] || 0) + 1);
    const topPages = Object.entries(pathCounts).map(([path, count]) => ({ path, count: count as number })).sort((a,b) => b.count - a.count).slice(0, 10);

    // Conversion
    const pageViews = count30 || 0;
    const { count: analyzeClicks } = await supabase.from('events').select('*', { count: 'exact', head: true }).eq('event_name', 'click_analyze').gte('created_at', last30Iso);
    const rate = pageViews > 0 ? ((analyzeClicks || 0) / pageViews) * 100 : 0;

    // Recent events
    const { data: recentEvents } = await supabase.from('events').select('*').order('created_at', { ascending: false }).limit(50);

    return res.status(200).json({
      stats: { today: countToday || 0, last7Days: count7 || 0, last30Days: count30 || 0, uniqueVisitors },
      topEvents,
      topPages,
      conversion: { pageViews, analyzeClicks: analyzeClicks || 0, rate },
      recentEvents
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
