# Working Hours Debug Guide

## Issue Description
The working hours are not saving correctly to the database. The data structure shows mixed content with appointment slots mixed in with working hours.

## Debug Steps

### 1. Check Current Database State
```bash
# Connect to MongoDB and check the current state
mongo
use riaya
db.doctors.findOne({}, {workingHours: 1, slotDuration: 1})
```

### 2. Test the API Endpoints

#### Test Current Data
```bash
curl -X GET "http://localhost:5000/api/doctor/test-data" \
  -H "dtoken: YOUR_DOCTOR_TOKEN"
```

#### Reset Working Hours (if needed)
```bash
curl -X POST "http://localhost:5000/api/doctor/reset-working-hours" \
  -H "dtoken: YOUR_DOCTOR_TOKEN"
```

#### Update Working Hours
```bash
curl -X POST "http://localhost:5000/api/doctor/update-slots-settings" \
  -H "Content-Type: application/json" \
  -H "dtoken: YOUR_DOCTOR_TOKEN" \
  -d '{
    "workingHours": {
      "SUN": {"from": "09:00", "to": "17:00"},
      "MON": {"from": "09:00", "to": "17:00"},
      "TUE": {"from": "09:00", "to": "17:00"},
      "WED": {"from": "09:00", "to": "17:00"},
      "THU": {"from": "09:00", "to": "17:00"},
      "FRI": {"from": "09:00", "to": "17:00"},
      "SAT": {"from": "09:00", "to": "17:00"}
    },
    "slotDuration": 30
  }'
```

### 3. Run Test Script
```bash
cd backend
node test-working-hours.js
```

## Expected Data Structure

The working hours should be saved as:
```json
{
  "workingHours": {
    "SUN": {"from": "09:00", "to": "17:00"},
    "MON": {"from": "09:00", "to": "17:00"},
    "TUE": {"from": "09:00", "to": "17:00"},
    "WED": {"from": "09:00", "to": "17:00"},
    "THU": {"from": "09:00", "to": "17:00"},
    "FRI": {"from": "09:00", "to": "17:00"},
    "SAT": {"from": "09:00", "to": "17:00"}
  },
  "slotDuration": 30
}
```

## Common Issues

### 1. Mixed Data
If you see data like `"2_7_2025": ["10:00 AM", "01:52 PM"]` in the workingHours field, it means appointment slots are being mixed with working hours.

**Solution**: Use the reset endpoint to clean the data.

### 2. Validation Errors
Check the server logs for validation errors:
- Time format must be HH:MM
- End time must be after start time
- Slot duration must be between 15-120 minutes

### 3. Database Connection Issues
Ensure MongoDB is running and the connection string is correct.

## Debugging Commands

### Check Server Logs
```bash
# Start the server with debug logging
npm run dev
```

### Check Database Directly
```bash
# Connect to MongoDB
mongo
use riaya

# Find a doctor and check their working hours
db.doctors.findOne({}, {name: 1, workingHours: 1, slotDuration: 1})

# Update working hours directly (for testing)
db.doctors.updateOne(
  {_id: ObjectId("DOCTOR_ID")},
  {
    $set: {
      workingHours: {
        SUN: {from: "09:00", to: "17:00"},
        MON: {from: "09:00", to: "17:00"},
        TUE: {from: "09:00", to: "17:00"},
        WED: {from: "09:00", to: "17:00"},
        THU: {from: "09:00", to: "17:00"},
        FRI: {from: "09:00", to: "17:00"},
        SAT: {from: "09:00", to: "17:00"}
      },
      slotDuration: 30
    }
  }
)
```

## Frontend Testing

1. Open the doctor profile page
2. Enable some working days
3. Set custom times
4. Click "Save Working Hours"
5. Check the browser network tab for the API response
6. Refresh the page to verify data persistence

## Backend Logs to Monitor

Look for these log messages:
- `=== Update Slots Settings Debug ===`
- `All validations passed, updating database...`
- `Update successful`
- `Updated working hours: {...}`
- `Updated slot duration: ...`

If you don't see these logs, the request might not be reaching the backend. 