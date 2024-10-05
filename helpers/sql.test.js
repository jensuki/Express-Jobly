const { sqlForPartialUpdate } = require('./sql');

describe('sqlForPartialUpdate', () => {
    test('updates one field', () => {
        const result = sqlForPartialUpdate({ name: 'newName' }, { name: 'name' });
        expect(result).toEqual({
            setCols: '"name"=$1',
            values: ['newName']
        })
    })
    test('updates multiple fields', () => {
        const result = sqlForPartialUpdate(
            { name: 'newName', numEmployees: 100 },
            { name: 'name', numEmployees: 'num_employees' }
        )
        expect(result).toEqual({
            setCols: '"name"=$1, "num_employees"=$2',
            values: ['newName', 100]
        })
    })
})
