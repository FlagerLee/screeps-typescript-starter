export class PriorityQueue<T> {
  // 队列本体，二叉堆，注意arr[0]未使用
  private readonly arr: T[];
  // 队列内容长度
  public size: number;
  // 判断函数
  private readonly judge: { (a: T, b: T): boolean };

  public constructor(judge: { (a: T, b: T): boolean } = (a, b) => a > b) {
    this.arr = [];
    this.size = 0;
    // 默认函数为大顶堆
    this.judge = judge;
  }

  // 队尾插入元素
  public push(val: T): void {
    // 队列长度+1
    this.size++;

    // 先插入到队尾
    this.arr[this.size] = val;
    // 从队尾开始上浮元素
    this.float(this.size);
  }

  // 移除队首元素
  public pop(): T | null {
    if (this.empty()) return null;
    // 将队首元素交换到队尾
    const t = this.swiper(1, this.size);
    // 删除队尾元素
    this.arr.length--;
    this.size--;

    // 从队首开始下沉
    this.sink(1);
    return t;
  }

  // 获取队首元素
  public peek(): T | null {
    if (this.empty()) return null;
    return this.arr[1];
  }

  /**
   * 删除元素(默认使用findIndex从队列中查找)
   * @param val 要删除的值
   * @param fun 该函数用于找到要删除的位置，默认以值相等代表找到
   * @return {boolean} true为删除成功
   */
  public remove(val: T, fun: (v: T) => boolean = v => v === val): boolean {
    let index = -1;
    // 找到第一个符合条件的值的下标，注意下标0没值，需要从1开始
    for (let i = 1; i < this.arr.length; i++) {
      if (fun(this.arr[i])) {
        index = i;
        break;
      }
    }
    if (index === -1) return false;

    // 将待删除元素与队尾元素交换
    this.swiper(index, this.size);
    // 删除队尾元素
    this.arr.length--;
    this.size--;

    // 因为是队尾换上来的，所以需要下沉
    this.sink(index);
    return true;
  }

  /**
   * 更新元素(默认使用findIndex从队列中查找)
   * @param oldVal 要删去的旧值
   * @param newVal 要更新的新值
   * @param fun 该函数用于找到要删除的位置，默认以值相等代表找到
   * @return {boolean} true为更新成功
   */
  public update(oldVal: T, newVal: T, fun: (v: T) => boolean = v => v === oldVal): boolean {
    // 先删去旧的
    const removeRes: boolean = this.remove(oldVal, fun);
    if (!removeRes) return false;

    // 再添加新的
    this.push(newVal);
    return true;
  }

  // 判空
  public empty(): boolean {
    return !this.size;
  }

  // 核心操作：上浮
  private float(index: number): void {
    // 父节点
    const pIndex: number = Math.trunc(index / 2);
    // 父节点存在且不满足判断规则
    if (pIndex > 0 && !this.judge(this.arr[pIndex], this.arr[index])) {
      // 交换父子节点
      this.swiper(pIndex, index);
      // 继续上浮
      this.float(pIndex);
    }
  }

  // 核心操作：下沉
  private sink(index: number): void {
    const leftIndex = index * 2;
    const rightIndex = leftIndex + 1;
    let acceptIndex = index;

    // 如果左节点存在且不满足条件，假装先让左节点为根
    if (leftIndex <= this.size && !this.judge(this.arr[acceptIndex], this.arr[leftIndex])) acceptIndex = leftIndex;

    // 右节点存在且不满足条件
    // 如果acceptIndex在右节点上面不满足条件，则让右节点为根
    if (rightIndex <= this.size && !this.judge(this.arr[acceptIndex], this.arr[rightIndex])) acceptIndex = rightIndex;

    // 如果acceptIndex没被替换，说明左右节点均满足条件，递归结束
    if (acceptIndex !== index) {
      this.swiper(index, acceptIndex);
      this.sink(acceptIndex);
    }
  }

  // 交换
  private swiper(i: number, j: number): T {
    const t: T = this.arr[i];
    this.arr[i] = this.arr[j];
    this.arr[j] = t;
    return t;
  }
}
