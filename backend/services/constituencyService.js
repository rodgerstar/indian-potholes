import Constituency from '../models/Constituency.js';
import MP from '../models/MP.js';

async function getStates() {
  const states = await Constituency.distinct('state');
  return states;
}

async function getConstituencies(state) {
  const constituencies = await Constituency.find({ state }).distinct('constituency');
  return constituencies;
}

async function getMLAAndParty(state, constituency) {
  const norm = s => s.replace(/[-\s]/g, '').toLowerCase();
  const docs = await Constituency.find({
    state: { $regex: `^${state.trim()}$`, $options: 'i' }
  });
  const entry = docs.find(doc => norm(doc.constituency) === norm(constituency));
  if (!entry) return null;
  return { 
    mla: entry.mla, 
    party: entry.party,
    email: entry.email,
    twitterHandle: entry.twitterHandle
  };
}

async function getParliamentaryConstituencies(state) {
  const constituencies = await MP.find({ 
    state: { $regex: `^${state.trim()}$`, $options: 'i' } 
  }).distinct('pc_name');
  return constituencies;
}

async function getMPByPC(state, pc_name) {
  const entry = await MP.findOne({
    state: { $regex: `^${state.trim()}$`, $options: 'i' },
    pc_name: { $regex: `^${pc_name.trim()}$`, $options: 'i' }
  });
  if (!entry) return null;
  return { 
    mp_name: entry.mp_name, 
    party: entry.mp_political_party,
    email: entry.email,
    twitterHandle: entry.twitterHandle
  };
}

export default {
  getStates,
  getConstituencies,
  getMLAAndParty,
  getParliamentaryConstituencies,
  getMPByPC,
}; 