echo 'start move file......'
cd /mnt/workspace/sdwebuiapi-flask/static
rm -f *.js *.css
mv /mnt/workspace/sd-web/dist/static/* .
cd /mnt/workspace/sdwebuiapi-flask/templates
mv /mnt/workspace/sd-web/dist/index.html .
echo 'move file end'