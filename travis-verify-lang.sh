cd "${0%/*}"
status=0
for lang in ./serge/*.json
do
	tmpLang="$(basename $lang)"
	tmpLang="./lang/${tmpLang/json/js.expected}"
	printf "export default " | cat -s - "$lang" > "$tmpLang"
	sed -i 's/\}\s*$/\};/' "$tmpLang"
	diff -b -B "${tmpLang%.expected}" "$tmpLang"
	if [ $? -ne 0 ]; then
		status=1
	fi
	rm "$tmpLang"
done

if [ $status -ne 0 ]; then
	echo "Files in the lang folder do not match the expected generated files from serge. Did you forget to run copy-to-lang.sh?" 1>&2
fi

exit $status;
