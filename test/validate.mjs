// A small JSON Schema checker for the keywords spec/openapi.json uses (type, enum, properties,
// required, items, additionalProperties, $ref, oneOf, anyOf, allOf). Returns a list of problems.
export function validate(schema, value, spec, path = '$', out = []) {
  if (!schema || typeof schema !== 'object') return out;
  if (schema.$ref) return validate(spec.components.schemas[schema.$ref.split('/').pop()], value, spec, path, out);
  if (schema.allOf) for (const s of schema.allOf) validate(s, value, spec, path, out);
  const alts = schema.oneOf || schema.anyOf;
  if (alts) {
    if (!alts.some((s) => validate(s, value, spec, path, []).length === 0)) out.push(`${path}: matches none of oneOf`);
    return out;
  }
  const types = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : null;
  if (types && !types.some((t) => is(t, value))) {
    out.push(`${path}: ${JSON.stringify(value)?.slice(0, 60)} is not ${types.join('|')}`);
    return out;
  }
  if (schema.enum && value !== null && !schema.enum.includes(value)) out.push(`${path}: ${JSON.stringify(value)} not in enum`);
  if (Array.isArray(value) && schema.items) {
    value.forEach((v, i) => {
      // samples.json trims lists to 3 items and appends "... N more"
      if (typeof v === 'string' && /^\.\.\. \d+ more$/.test(v)) return;
      validate(schema.items, v, spec, `${path}[${i}]`, out);
    });
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const k of schema.required || []) if (!(k in value)) out.push(`${path}: missing ${k}`);
    for (const [k, v] of Object.entries(value)) {
      if (schema.properties?.[k]) validate(schema.properties[k], v, spec, `${path}.${k}`, out);
      else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
        validate(schema.additionalProperties, v, spec, `${path}.${k}`, out);
      }
    }
  }
  return out;
}

function is(t, v) {
  switch (t) {
    case 'null': return v === null;
    case 'string': return typeof v === 'string';
    case 'boolean': return typeof v === 'boolean';
    case 'integer': return Number.isInteger(v);
    case 'number': return typeof v === 'number';
    case 'array': return Array.isArray(v);
    case 'object': return v !== null && typeof v === 'object' && !Array.isArray(v);
    default: return true;
  }
}

/** '/movies/titles/m603/full' -> '/movies/titles/{id}/full', by matching the spec's templates. */
export function routeOf(spec, route) {
  const path = route.split('?')[0];
  if (spec.paths[path]) return path;
  const segs = path.split('/');
  return Object.keys(spec.paths).find((p) => {
    const t = p.split('/');
    return t.length === segs.length && t.every((s, i) => s === segs[i] || /^\{\w+\}$/.test(s));
  });
}
