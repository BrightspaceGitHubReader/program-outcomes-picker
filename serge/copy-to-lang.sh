#!/bin/bash
cd "${0%/*}"
for lang in *.json
do
	printf "export default " | cat -s - "$lang" > "../lang/${lang/json/js}"
	sed -i 's/\}\s*$/\};/' "../lang/${lang/json/js}"
done
