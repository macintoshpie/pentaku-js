from flask import Flask, render_template
app = Flask(__name__)


@app.route('/')
def hello():
	return render_template('index.html')
    #return "Hello World!"

if __name__ == '__main__':
    app.run()
    #app.debug = True
    #port = int(os.environ.get("PORT", 5000))
    #app.run(host='0.0.0.0', port=port)