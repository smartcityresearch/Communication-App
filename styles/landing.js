import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: 'white',
  },
 
  errorText: {
    color: 'red',
    fontSize: 14,
    marginTop: 10,
    marginBottom: 10,
    textAlign: 'center',
  },
  successText: {
    color: 'green',
    fontSize: 14,
    marginTop: 10,
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
  submitButtonContainer: {
    marginTop: 20,
  },
  pickerWrapper: {
  position: 'relative',
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 8,
  backgroundColor: 'white',
  marginBottom: 15,
  overflow: 'hidden',
},
fakePicker: {
  height: 50,
  justifyContent: 'center',
  paddingHorizontal: 15,
},
actualPicker: {
  position: 'absolute',
  width: '100%',
  height: '100%',
  opacity: 0, // hides actual picker but keeps it functional
},
});

export default styles;