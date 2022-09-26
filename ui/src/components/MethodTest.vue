<template>
  <div>
    <h1>normal script vue</h1>
    <p>{{ id }}</p>
  </div>
</template>

<script lang="ts">
import { debounce } from "lodash-es";
import { defineComponent } from "vue";
const App = defineComponent({
  data() {
    return {
      id: 0,
    };
  },

  mounted() {
    this.click();
  },

  methods: {
    // 使用 Lodash 的防抖函数
    click: debounce(function (this: { id: number }) {
      // ... 对点击的响应 ...
      this.id++;
    }, 500),
  },
});
export default App;
</script>
