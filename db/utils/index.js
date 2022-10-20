const crypto = require('crypto');

const sortObj = (obj) => {
  if (typeof obj !== 'object') return obj;
  // eslint-disable-next-line no-undef
  if (Array.isArray(obj)) return obj.map((item) => sortObj(item));
  return Object.keys(obj)
    .sort()
    .reduce((result, key) => {
      // eslint-disable-next-line no-undef, no-param-reassign
      result[key] = sortObj(obj[key]);
      return result;
    }, {});
};
const hashObject = (object) => {
  const newObject = sortObj(object);
  const hash = crypto
    .createHash('md5')
    .update(
      JSON.stringify(newObject, (k, v) => {
        if (k[0] === '_') return undefined;
        // remove api stuff
        if (typeof v === 'function')
          // consider functions
          return v.toString();
        return v;
      })
    )
    .digest('hex');
  return hash;
};
const grenarateUserUnits = async (setting) => {
  let userUnits = [];
  setting?.units?.forEach((unit, index) => {
    userUnits[index] = {
      actitivies: [],
    };
    unit.actitivies.forEach((activiti, _index) => {
      userUnits[index].actitivies[_index] = {
        status: 0,
        description: activiti.description,
        type: activiti.type,
      };
      if ([2].includes(activiti.type)) {
        userUnits[index].actitivies[_index].data = {
          ans: activiti.data.questions.map(() => ''),
        };
      }
      if ([3, 4, 5].includes(activiti.type)) {
        userUnits[index].actitivies[_index].data = {
          ans: activiti.data.map(() => ''),
        };
      }
      if ([6].includes(activiti.type)) {
        userUnits[index].actitivies[_index].audioUrl = '';
      }
      if ([7].includes(activiti.type)) {
        userUnits[index].actitivies[_index].data = {
          ans: '',
          question: '',
        };
      }
    });
  });
  return userUnits;
};
module.exports = {
  sortObj,
  hashObject,
  grenarateUserUnits,
};
