from flask import Flask, render_template, send_file
app = Flask(__name__, static_url_path='')


@app.route('/')
def hello():
	return send_file('index.html')
	#return render_template('index.html')
    #return "Hello World!"

if __name__ == '__main__':
    app.run()
    #app.debug = True
    #port = int(os.environ.get("PORT", 5000))
    #app.run(host='0.0.0.0', port=port)