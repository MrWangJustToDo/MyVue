import { defineComponent, onMounted, ref } from "vue";

const App = defineComponent({
  setup() {
    const count = ref(0);

    const inc = () => {
      count.value++;
    };

    onMounted(() => {
      console.log(count, App);
    });

    return () => (
      <>
        <div onClick={inc}>{count.value}</div>
        <button onClick={inc}>jsx</button>
      </>
    );
  },
});

export default App;
