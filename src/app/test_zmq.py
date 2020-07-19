import time
import threading
import zmq

worker_url="inproc://worker"

def worker_routine1(context=None):
    """Worker routine"""
    context = context or zmq.Context.instance()
    receiver = context.socket(zmq.PAIR)
    receiver.bind(worker_url+"1")

    while True:
        string  = receiver.recv()
        print("Received request 1: [ %s ]" % (string))
        time.sleep(1)

def worker_routine2(context=None):
    """Worker routine"""
    context = context or zmq.Context.instance()
    receiver = context.socket(zmq.PAIR)
    receiver.bind(worker_url+"2")

    while True:
        string  = receiver.recv()
        print("Received request 2: [ %s ]" % (string))
        time.sleep(1)



def main():
    """ server routine """
    # Prepare our context and sockets
    context = zmq.Context.instance()
    thread1 = threading.Thread(target=worker_routine1)
    thread1.start()

    thread2 = threading.Thread(target=worker_routine2)
    thread2.start()


    sender = context.socket(zmq.PAIR)
    #sender.connect(worker_url+"1")
    sender.connect(worker_url+"2")
    sender.send(b"hello world")
    name = input("Enter your name: ")
    context.term()

if __name__ == "__main__":
    main()
