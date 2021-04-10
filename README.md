To run this in HTTPS, we need to install a tool called mkcert. Follow the installation instructions or if you’re using macOS and Homebrew, run this command:

$ brew install mkcert
Create a local CA and create certificate for localhost:

$ mkcert -install
$ mkcert localhost
