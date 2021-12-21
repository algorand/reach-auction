# reach-auction
Getting Started With Reach


## Install Reach

Reach is designed to work on POSIX systems with [make](https://en.wikipedia.org/wiki/Make_(software)), [Docker](https://www.docker.com/get-started), and [Docker Compose](https://docs.docker.com/compose/install/) installed. The best way to install Docker on Mac and Windows is with [Docker Desktop](https://www.docker.com/products/docker-desktop).


To confirm everything is installed try to run the following three commands and see no errors

``` bash
$ make --version
$ docker --version
$ docker-compose --version
```

If you’re using Windows, consult [the guide to using Reach on Windows](https://docs.reach.sh/guide-windows.html).

Once you've confirmed that the Reach prerequisites are installed, choose a directory for this project such as:

``` bash
$ mkdir -p ~/reach && cd ~/reach
```

## Clone the Reach Auction demo application

Clone the repository using the following commands.

```bash
git clone https://github.com/algorand/reach-auction.git 

```

Navigate to the project folder

``` bash
cd reach_auction
```

Next, download Reach by running

``` bash
$ curl https://docs.reach.sh/reach -o reach ; chmod +x reach
```

Confirm the download worked by running

``` bash
$ ./reach version
```

Since Reach is Dockerized, when first used, the images it uses need to be downloaded. This will happen automatically when used for the first time, but can be done manually now by running

``` bash
$ ./reach update
```

You’ll know that everything is in order if you can run

``` bash
$ ./reach compile --help
```

To determine the current version is installed, run

``` bash
$ ./reach hashes
```

Output should look similar to:

``` bash
reach: fb449c94
reach-cli: fb449c94
react-runner: fb449c94
rpc-server: fb449c94
runner: fb449c94
devnet-algo: fb449c94
devnet-cfx: fb449c94
devnet-eth: fb449c94
```

All of the hashes listed should be the same and then visit the #releases channel on the [Reach Discord Server](https://discord.gg/9kbHPfwbwn) to see the current hashes.

More information: Detailed Reach install instructions can be found in the [docs](https://developer.algorand.org/docs/get-started/dapps/reach/). 