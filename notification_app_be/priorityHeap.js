
class MinHeap {
  constructor(maxSize) {
    this.heap = [];
    this.maxSize = maxSize;
  }

  
  parentIndex(i) {
    return Math.floor((i - 1) / 2);
  }

  
  leftChild(i) {
    return 2 * i + 1;
  }

  
  rightChild(i) {
    return 2 * i + 2;
  }

  
  swap(i, j) {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }

  
  size() {
    return this.heap.length;
  }

  
  peek() {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  
  heapifyUp(i) {



    while (i > 0 && this.heap[this.parentIndex(i)].score > this.heap[i].score) {
      this.swap(i, this.parentIndex(i));
      i = this.parentIndex(i);
    }
  }

  
  heapifyDown(i) {
    let smallest = i;
    const left = this.leftChild(i);
    const right = this.rightChild(i);

    if (left < this.heap.length && this.heap[left].score < this.heap[smallest].score) {
      smallest = left;
    }
    if (right < this.heap.length && this.heap[right].score < this.heap[smallest].score) {
      smallest = right;
    }

    if (smallest !== i) {
      this.swap(i, smallest);
      this.heapifyDown(smallest);
    }
  }

  
  insert(notification) {
    if (this.heap.length < this.maxSize) {
      this.heap.push(notification);
      this.heapifyUp(this.heap.length - 1);
    } else if (notification.score > this.heap[0].score) {

      this.heap[0] = notification;
      this.heapifyDown(0);
    }
  }

  
  extractMin() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();

    const min = this.heap[0];
    this.heap[0] = this.heap.pop();
    this.heapifyDown(0);
    return min;
  }

  
  getSorted() {
    const sorted = [...this.heap];
    sorted.sort((a, b) => b.score - a.score);
    return sorted;
  }
}

module.exports = { MinHeap };
