// pages/api/dev/analytics.js — Advanced Analytics API for Premium
const { adminDb } = require('../../../lib/firebaseAdmin');

const DEV_PASSWORD = process.env.DEV_PORTAL_PASSWORD || 'restaurantos-dev-2026';
function auth(req) { return req.headers['x-dev-password'] === DEV_PASSWORD; }

export default async function handler(req, res) {
  if (!auth(req)) return res.status(401).json({ error: 'Unauthorized' });
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { restaurantId, period } = req.query;
  if (!restaurantId) return res.status(400).json({ error: 'restaurantId required' });

  try {
    // Fetch all orders for the restaurant
    const ordersSnap = await adminDb.collection('orders')
      .where('restaurant_id', '==', restaurantId)
      .get();

    const orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Fetch menu items
    const menuSnap = await adminDb.collection('menu_items')
      .where('restaurant_id', '==', restaurantId)
      .get();
    const menuItems = menuSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Fetch tables
    const tablesSnap = await adminDb.collection('tables')
      .where('restaurant_id', '==', restaurantId)
      .get();
    const tables = tablesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(todayStart);
    monthStart.setDate(monthStart.getDate() - 30);

    const getDate = (ts) => {
      if (!ts) return null;
      if (ts._seconds) return new Date(ts._seconds * 1000);
      if (ts.toDate) return ts.toDate();
      return new Date(ts);
    };

    // Categorize orders by time
    const todayOrders = orders.filter(o => {
      const d = getDate(o.created_at);
      return d && d >= todayStart;
    });

    const weekOrders = orders.filter(o => {
      const d = getDate(o.created_at);
      return d && d >= weekStart;
    });

    const monthOrders = orders.filter(o => {
      const d = getDate(o.created_at);
      return d && d >= monthStart;
    });

    // Revenue calculations
    const calcRevenue = (orderList) => {
      const paid = orderList.filter(o => o.payment_status === 'paid');
      return paid.reduce((s, o) => s + (o.total || o.subtotal || 0), 0);
    };

    const calcTips = (orderList) => {
      const paid = orderList.filter(o => o.payment_status === 'paid');
      return paid.reduce((s, o) => s + (o.tip || 0), 0);
    };

    // Top selling items
    const itemCounts = {};
    const itemRevenue = {};
    orders.forEach(o => {
      (o.items || []).forEach(item => {
        const key = item.name;
        if (!itemCounts[key]) itemCounts[key] = { name: key, count: 0, revenue: 0 };
        itemCounts[key].count += item.quantity;
        itemCounts[key].revenue += item.price * item.quantity;
      });
    });
    const topItems = Object.values(itemCounts).sort((a, b) => b.count - a.count).slice(0, 10);

    // Category breakdown
    const categoryBreakdown = {};
    orders.forEach(o => {
      (o.items || []).forEach(item => {
        // Find category from menu items
        const menuItem = menuItems.find(m => m.name === item.name);
        const cat = menuItem?.category || 'Other';
        if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { category: cat, count: 0, revenue: 0 };
        categoryBreakdown[cat].count += item.quantity;
        categoryBreakdown[cat].revenue += item.price * item.quantity;
      });
    });

    // Peak hours analysis (last 30 days)
    const hourCounts = Array(24).fill(0);
    monthOrders.forEach(o => {
      const d = getDate(o.created_at);
      if (d) hourCounts[d.getHours()]++;
    });
    const peakHours = hourCounts.map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Daily revenue for the last 7 days
    const dailyRevenue = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(todayStart);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayOrders = orders.filter(o => {
        const d = getDate(o.created_at);
        return d && d >= dayStart && d < dayEnd && o.payment_status === 'paid';
      });

      dailyRevenue.push({
        date: dayStart.toISOString().split('T')[0],
        day: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: dayOrders.reduce((s, o) => s + (o.total || o.subtotal || 0), 0),
        orders: dayOrders.length,
      });
    }

    // Table utilization
    const tableUtilization = tables.map(t => {
      const tableOrders = orders.filter(o => o.table_number === t.number);
      return {
        number: t.number,
        seats: t.seats,
        totalOrders: tableOrders.length,
        revenue: tableOrders.filter(o => o.payment_status === 'paid')
          .reduce((s, o) => s + (o.total || o.subtotal || 0), 0),
      };
    }).sort((a, b) => b.totalOrders - a.totalOrders);

    // Order status distribution
    const statusDist = {};
    orders.forEach(o => {
      const s = o.status || 'unknown';
      statusDist[s] = (statusDist[s] || 0) + 1;
    });

    // Average order value
    const paidOrders = orders.filter(o => o.payment_status === 'paid');
    const avgOrderValue = paidOrders.length > 0
      ? Math.round(paidOrders.reduce((s, o) => s + (o.total || o.subtotal || 0), 0) / paidOrders.length)
      : 0;

    // Average preparation time (rough estimate based on status timestamps)
    const avgPrepTime = null; // Would need status change timestamps

    return res.status(200).json({
      overview: {
        totalOrders: orders.length,
        paidOrders: paidOrders.length,
        activeOrders: orders.filter(o => o.payment_status === 'pending').length,
        totalRevenue: calcRevenue(orders),
        totalTips: calcTips(orders),
        avgOrderValue,
        totalMenuItems: menuItems.length,
        totalTables: tables.length,
        availableItems: menuItems.filter(m => m.available !== false).length,
        unavailableItems: menuItems.filter(m => m.available === false).length,
      },
      today: {
        orders: todayOrders.length,
        revenue: calcRevenue(todayOrders),
        tips: calcTips(todayOrders),
        paidOrders: todayOrders.filter(o => o.payment_status === 'paid').length,
      },
      week: {
        orders: weekOrders.length,
        revenue: calcRevenue(weekOrders),
        tips: calcTips(weekOrders),
      },
      month: {
        orders: monthOrders.length,
        revenue: calcRevenue(monthOrders),
        tips: calcTips(monthOrders),
      },
      topItems,
      categoryBreakdown: Object.values(categoryBreakdown),
      peakHours,
      dailyRevenue,
      tableUtilization,
      statusDistribution: statusDist,
    });
  } catch (err) {
    console.error('Analytics error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
