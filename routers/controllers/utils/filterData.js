function filterField(ObjFilter, pros = []) {
    const data = {};
    // eslint-disable-next-line no-restricted-syntax
    for (const p of pros) {
        if (ObjFilter[p] !== undefined) data[p] = ObjFilter[p];
    }
    return data;
}

module.exports = filterField;
