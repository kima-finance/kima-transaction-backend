const server = require('../index.ts');
const supertest = require('supertest');
const requestWithSupertest = supertest(server);

describe('api test', () => {
  it('should fail to check compliant endpoint', async () => {
    const res = await requestWithSupertest.post('/compliant').send({})
    console.log(res.text)
    expect(res.status).toEqual(500)
  })

  it('should return high risk from compliant endpoint', async () => {
    const res = await requestWithSupertest.post('/compliant').send({
      address: '0xDD4c48C0B24039969fC16D1cdF626eaB821d3384'
    })
    expect(res.status).toEqual(200)
    expect(res.text).toEqual('high')
    expect(res.type).toEqual(expect.stringContaining('text/html'))
  })

  it('should return medium risk from compliant endpoint', async () => {
    const res = await requestWithSupertest.post('/compliant').send({
      address: '0x001474b877f98f41701397a65d4d313ab180c7b2'
    })
    expect(res.status).toEqual(200)
    expect(res.text).toEqual('medium')
    expect(res.type).toEqual(expect.stringContaining('text/html'))
  })

  it('should return low risk from compliant endpoint', async () => {
    const res = await requestWithSupertest.post('/compliant').send({
      address: '0x76d031825134aaf073436Aba2087a3B589babd9F'
    })
    expect(res.status).toEqual(200)
    expect(res.text).toEqual('low')
    expect(res.type).toEqual(expect.stringContaining('text/html'))
  })

  it('should return ok from auth endpoint', async () => {
    const res = await requestWithSupertest.post('/auth').send({
      originAddress: '0x76d031825134aaf073436Aba2087a3B589babd9F'
    })
    expect(res.status).toEqual(200)
    expect(res.text).toEqual('ok')
  })

  it('should return 500 error from submit endpoint', async () => {
    const res = await requestWithSupertest.post('/submit').send({
      originAddress: '0x76d031825134aaf073436Aba2087a3B589babd9F'
    })
    expect(res.status).toEqual(500)
    expect(res.text).toEqual('validation error')
  })

  it('should validate invalid Solana address', async () => {
    const res = await requestWithSupertest.post('/submit').send({
      originAddress: '8bct1AEUdkfVdEaQBrFVpCYXdw6kUDReo5ZF3cxqsEQU',
      originChain: 'SOL',
      targetAddress: '0x76d031825134aaf073436Aba2087a3B589babd9F',
      targetChain: 'POL',
      symbol: 'USDK',
      amount: 100,
      fee: 0.5
    })
    expect(res.status).toEqual(500)
    expect(res.text).toEqual('validation error')
  })

  it('should fail to submit transaction due to risky addresses', async () => {
    const res = await requestWithSupertest.post('/submit').send({
      originAddress: '0xDD4c48C0B24039969fC16D1cdF626eaB821d3384',
      targetAddress: '0x001474b877f98f41701397a65d4d313ab180c7b2',
      originChain: 'ETH',
      targetChain: 'POL',
      symbol: 'USDK',
      amount: 100,
      fee: 0.5
    })
    
    expect(res.status).toEqual(500)
    expect(res.text).toContain('risk')
  })

  // it('should succeed to submit transaction', async () => {
  //   const res = await requestWithSupertest.post('/submit').send({
  //     originAddress: '0x76d031825134aaf073436Aba2087a3B589babd9F',
  //     targetAddress: '0x76d031825134aaf073436Aba2087a3B589babd9F',
  //     originChain: 'ETH',
  //     targetChain: 'POL',
  //     symbol: 'USDK',
  //     amount: 100,
  //     fee: 0.5
  //   })
    
  //   expect(res.status).toEqual(500)
  //   expect(res.type).toEqual(expect.stringContaining('text/html'))
  // })
})
