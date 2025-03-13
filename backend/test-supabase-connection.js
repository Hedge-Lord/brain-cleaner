// Test Supabase connection
require('dotenv').config({ path: './backend/.env' });
const { supabase } = require('./src/db');

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Get Supabase version
    const { data, error } = await supabase.from('users').select('id').limit(1);
    
    if (error) {
      console.error('Connection error:', error);
      return;
    }
    
    console.log('Successfully connected to Supabase!');
    console.log('Data retrieved:', data);
    
    // Test insert operation
    const testUser = {
      email: `test_${Date.now()}@example.com`,
      password: 'password_for_testing',
      is_verified: true
    };
    
    console.log('Attempting to insert test user...');
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert(testUser)
      .select();
    
    if (insertError) {
      console.error('Insert error:', insertError);
    } else {
      console.log('Successfully inserted test user:', insertData);
      
      // Clean up - delete the test user
      console.log('Cleaning up test data...');
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', insertData[0].id);
      
      if (deleteError) {
        console.error('Delete error:', deleteError);
      } else {
        console.log('Test user successfully deleted.');
      }
    }
  } catch (err) {
    console.error('Error testing connection:', err);
  }
}

testConnection();
