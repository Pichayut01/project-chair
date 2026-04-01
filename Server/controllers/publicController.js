const User = require('../models/User');
const Class = require('../models/Class');

const normalizePathPrefix = (value = '') => {
    if (!value || value === '/') return '';
    return `/${String(value).replace(/^\/+|\/+$/g, '')}`;
};

const getRequestBaseUrl = (req) => {
    const forwardedPrefix = normalizePathPrefix(req.get('x-forwarded-prefix'));
    return `${req.protocol}://${req.get('host')}${forwardedPrefix}`;
};

// @desc    Get public stats for landing page
// @route   GET /api/public/stats
// @access  Public
exports.getStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalClasses = await Class.countDocuments();

        // Fetch users who have a photoURL
        const usersWithPhotos = await User.find({
            photoURL: { $exists: true, $ne: null, $ne: '' }
        })
            .select('photoURL name displayName')
            .limit(40)
            .lean();

        let avatars = usersWithPhotos.map(u => {
            let photoUrl = u.photoURL;
            if (photoUrl && !photoUrl.startsWith('http')) {
                // Handle relative paths from /uploads
                const baseUrl = process.env.BASE_URL || getRequestBaseUrl(req);
                photoUrl = photoUrl.startsWith('/') ? `${baseUrl}${photoUrl}` : `${baseUrl}/${photoUrl}`;
            }
            return {
                type: 'image',
                url: photoUrl
            };
        });

        // Ensure we have enough avatars to fill the marquee (at least 30)
        if (avatars.length < 30) {
            const remaining = 30 - avatars.length;
            for (let i = 0; i < remaining; i++) {
                avatars.push({
                    type: 'image',
                    url: `https://i.pravatar.cc/150?u=fallback${i}`
                });
            }
        }

        // Get up to 5 recent classes to use for the initials and color
        const recentClasses = await Class.find()
            .sort({ _id: -1 })
            .select('name color')
            .limit(5)
            .lean();

        // Map to specific avatar objects with initials
        const classIcons = recentClasses.map(c => ({
            initials: c.name ? c.name.substring(0, 2).toUpperCase() : 'C',
            color: c.color || '#00D06C'
        }));

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalClasses,
                classIcons: classIcons,
                avatars: avatars
            }
        });
    } catch (error) {
        console.error('Error fetching public stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
