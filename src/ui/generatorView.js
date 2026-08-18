export function generatedSummary(files){
  return files.map(file=>file.path).join('\n');
}
