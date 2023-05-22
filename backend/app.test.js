const request = require('supertest');
const app = require('./app');
const { getOneItem } = require('./app');

//test getOneItem
describe('Inventory getOneItem', () => {
  test('1. test getOneItem function', async () => {
    // set the expected result
    const expectedResult = [{
      item_id: 123,
      item_desc: 'iPad',
      category: 'IT',
      condition: 'new',
      qty: 1,
      possession: 'Sathy',
      address_id: 1      
    }];

    // call the function 
    const req = {params:{ id: 123 }}
    
    const actualResult = await getOneItem(req);
    
    expect(actualResult).toEqual(expectedResult);
    
    //display results
    const result = { expectedResult, actualResult };
    console.log("Test Results", result);
        
  });
});
