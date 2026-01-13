require('dotenv').config();
const mongoose = require('mongoose');
const Class = require('./models/Class');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const classes = await Class.find({ 'classroomEvents.0': { $exists: true } });
        console.log(`Found ${classes.length} classes with events.`);

        classes.forEach(c => {
            console.log(`Class: ${c.name} (${c.classCode})`);
            console.log('Events:', JSON.stringify(c.classroomEvents, null, 2));
        });

        if (classes.length === 0) {
            console.log('No classes found with events. This confirms the server is NOT saving events (Restart needed).');
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

connectDB();
