const profiles = [
  {
    id: 1,
    firstName: 'Tayo',
    lastName: 'Babatunde',
    profession: 'Software Client',
    balance: 100,
    type: 'client',
    version: true
  },
  {
    id: 2,
    firstName: 'Omotayo',
    lastName: 'Obafemi',
    profession: 'Software Engineer',
    balance: 100,
    type: 'contractor',
    version: true
  }
]

const contracts = [{
  id: 1,
  terms: 'First Sample terms',
  status: 'in_progress',
  contractorId: 2,
  clientId: 1,
  version: true
},
{
  id: 2,
  terms: 'Second Sample terms',
  status: 'in_progress',
  contractorId: 2,
  clientId: 1,
  version: true
},
{
  id: 3,
  terms: 'Third Sample terms',
  status: 'terminated',
  contractorId: 2,
  clientId: 1,
  version: true
}]

const jobs = [{
  id: 1,
  description: 'Sample job description',
  price: 50.00,
  paid: false,
  paymentDate: null,
  contractId: 1,
  version: true
},
{
  id: 2,
  description: 'Second Sample job description',
  price: 50.00,
  paid: false,
  paymentDate: null,
  contractId: 1,
  version: true
},
{
  id: 3,
  description: 'Third Sample job description',
  price: 50.00,
  paid: true,
  paymentDate: null,
  contractId: 1,
  version: true
}
]

module.exports = { profiles, contracts, jobs }
