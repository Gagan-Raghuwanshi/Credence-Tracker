import {Statistics} from '../models/stastic.model.js'


const getDateRange = (type) => {
    const now = new Date();
    let startDate, endDate;

    switch (type) {
        case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            break;
        case 'yesterday':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case 'thisWeek':
            const firstDayOfWeek = now.getDate() - now.getDay();
            startDate = new Date(now.setDate(firstDayOfWeek));
            endDate = new Date(now.setDate(firstDayOfWeek + 7));
            break;
        case 'previousWeek':
            const prevWeekStart = new Date(now.setDate(now.getDate() - now.getDay() - 7));
            const prevWeekEnd = new Date(now.setDate(prevWeekStart.getDate() + 6));
            startDate = prevWeekStart;
            endDate = prevWeekEnd;
            break;
        case 'thisMonth':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            break;
        case 'previousMonth':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'custom':
            if (!startDate || !endDate) {
            throw new Error('Custom range requires both startDate and endDate');
           }
        rangeStartDate = new Date(startDate);
        rangeEndDate = new Date(endDate);
        break;
        default:
            throw new Error('Invalid date range type');
    }
    return { startDate, endDate };
};

export const getStatisticsByCondition = async (rangeType) => {
    const { startDate, endDate } = getDateRange(rangeType);
  

    
    // Capture the current time when statistics are generated
    const captureTime = new Date(); 

    // Query to get the number of active users within the specified time range
    const activeUsers = await User.countDocuments({
        lastActive: { $gte: startDate, $lt: endDate }
    });

    // Query to get the distinct devices used by the active users
    const activeDevices = await UserSession.distinct('deviceId', {
        lastActive: { $gte: startDate, $lt: endDate }
    });

    return {
        captureTime,
        activeUsers,
        activeDevices: activeDevices.length
    };
};

